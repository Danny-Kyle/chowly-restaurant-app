"""Real PostgreSQL regression tests. Only runs against a database named chowly_test."""
import concurrent.futures
import json
import os
from pathlib import Path
import shutil
import subprocess
import threading
import unittest

PSQL = os.environ.get('PSQL_BIN') or shutil.which('psql')
if not PSQL and os.name == 'nt':
    PSQL = r'C:\Program Files\PostgreSQL\18\bin\psql.exe'
URL = os.environ.get('TEST_DATABASE_URL', 'postgresql://chowly_test@127.0.0.1:55439/chowly_test')


def sql(statement, succeeds=True):
    result = subprocess.run([PSQL, URL, '-X', '-qAt', '-v', 'ON_ERROR_STOP=1',
                             '-v', 'VERBOSITY=verbose', '-c', statement],
                            text=True, capture_output=True, timeout=25)
    if succeeds and result.returncode:
        raise AssertionError(result.stderr)
    if not succeeds:
        if not result.returncode:
            raise AssertionError('Query unexpectedly succeeded: ' + statement)
        return result.stderr
    return result.stdout.strip()


def rpc(name, *args):
    def quote(value):
        if value is None:
            return 'null'
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, list):
            value = json.dumps(value)
        return "'" + value.replace("'", "''") + "'"
    return f"select {name}({','.join(quote(v) for v in args)});"


class DatabaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if sql('select current_database()') != 'chowly_test':
            raise RuntimeError('Refusing to modify any database except chowly_test')
        # Simulate Supabase's public roles, then apply the migration a second time.
        sql("""do $$ begin
          if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
          if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
          if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
        end $$;""")
        sql(Path('supabase/migrations/001_atomic_workflows.sql').read_text(encoding='utf-8'))

    def setUp(self):
        sql("truncate orders, customers cascade; insert into customers(customer_id,first_name) values ('CUS_TEST','Alex'),('CUS_OTHER','Sam');")

    def order(self, cart=None):
        return json.loads(sql(rpc('chowly_place_order', 'CUS_TEST', 'RES001',
                                  cart or [{'menuItemId': 'MIT001', 'quantity': 1}])))

    def served_order(self):
        data = self.order()
        order_id = data['order']['order_id']
        sql(rpc('chowly_assign_preparer', order_id, data['items'][0]['order_item_id'], 'CHF001'))
        return json.loads(sql(rpc('chowly_serve_order', order_id, 'WAI001')))

    def race(self, statements):
        barrier = threading.Barrier(len(statements))
        def run(statement):
            barrier.wait(timeout=10)
            return subprocess.run([PSQL, URL, '-XqAt', '-v', 'ON_ERROR_STOP=1', '-c', statement],
                                  text=True, capture_output=True, timeout=25)
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(statements)) as pool:
            return list(pool.map(run, statements))

    def test_total_and_parallel_station_wait_come_from_menu(self):
        data = self.order([{'menuItemId': 'MIT001', 'quantity': 2}, {'menuItemId': 'MIT004', 'quantity': 1}])
        self.assertEqual(data['order']['total_order_amount'], 42400)
        self.assertEqual(data['order']['estimated_waiting_time'], 40)
        self.assertEqual(len(data['items']), 2)

    def test_order_and_all_lines_roll_back_on_invalid_second_item(self):
        error = sql(rpc('chowly_place_order', 'CUS_TEST', 'RES001', [
            {'menuItemId': 'MIT001', 'quantity': 1}, {'menuItemId': 'missing', 'quantity': 1}]), False)
        self.assertIn('22023', error)
        self.assertEqual(sql('select count(*) from orders'), '0')
        self.assertEqual(sql('select count(*) from order_items'), '0')

    def test_invalid_quantities_rejected(self):
        for quantity in [0, -1, 1.5, '2', None]:
            with self.subTest(quantity=quantity):
                sql(rpc('chowly_place_order', 'CUS_TEST', 'RES001', [{'menuItemId': 'MIT001', 'quantity': quantity}]), False)
        self.assertEqual(sql('select count(*) from orders'), '0')

    def test_unavailable_menu_and_wrong_restaurant_rejected(self):
        sql("update menu_items set availability_status='Unavailable' where menu_item_id='MIT001'")
        try:
            sql(rpc('chowly_place_order', 'CUS_TEST', 'RES001', [{'menuItemId': 'MIT001', 'quantity': 1}]), False)
        finally:
            sql("update menu_items set availability_status='Available' where menu_item_id='MIT001'")
        sql(rpc('chowly_place_order', 'CUS_TEST', 'not-a-restaurant', [{'menuItemId': 'MIT001', 'quantity': 1}]), False)

    def test_parallel_orders_have_unique_ids(self):
        results = self.race([rpc('chowly_place_order', 'CUS_TEST', 'RES001', [{'menuItemId': 'MIT001', 'quantity': 1}])] * 8)
        self.assertTrue(all(r.returncode == 0 for r in results), [r.stderr for r in results])
        self.assertEqual(sql('select count(distinct order_id) from orders'), '8')
        self.assertEqual(sql('select count(distinct order_item_id) from order_items'), '8')

    def test_assignment_cannot_cross_orders_or_staff_roles(self):
        first, second = self.order(), self.order()
        oid = first['order']['order_id']
        sql(rpc('chowly_assign_preparer', oid, second['items'][0]['order_item_id'], 'CHF001'), False)
        sql(rpc('chowly_assign_preparer', oid, first['items'][0]['order_item_id'], 'BTD001'), False)

    def test_serve_requires_assignments_and_replay_preserves_timestamp(self):
        data = self.order()
        oid = data['order']['order_id']
        sql(rpc('chowly_serve_order', oid, 'WAI001'), False)
        sql(rpc('chowly_assign_preparer', oid, data['items'][0]['order_item_id'], 'CHF001'))
        first = json.loads(sql(rpc('chowly_serve_order', oid, 'WAI001')))
        second = json.loads(sql(rpc('chowly_serve_order', oid, 'WAI001')))
        self.assertEqual(first['served_at'], second['served_at'])
        sql(rpc('chowly_cancel_order', oid, 'customer'), False)

    def test_pending_cancelled_and_underpaid_orders_cannot_be_paid(self):
        pending = self.order()['order']
        sql(rpc('chowly_pay_order', pending['order_id'], pending['total_order_amount']), False)
        sql(rpc('chowly_cancel_order', pending['order_id'], 'customer'))
        sql(rpc('chowly_pay_order', pending['order_id'], pending['total_order_amount']), False)
        served = self.served_order()
        for amount in [0, -1, served['total_order_amount'] - 1, served['total_order_amount'] + 1, None]:
            sql(rpc('chowly_pay_order', served['order_id'], amount), False)
        self.assertEqual(sql('select count(*) from payments'), '0')

    def test_concurrent_payment_replays_record_one_payment(self):
        order = self.served_order()
        results = self.race([rpc('chowly_pay_order', order['order_id'], order['total_order_amount'])] * 8)
        self.assertTrue(all(r.returncode == 0 for r in results), [r.stderr for r in results])
        ids = {json.loads(r.stdout)['payment']['payment_id'] for r in results}
        self.assertEqual(len(ids), 1)
        self.assertEqual(sql('select count(*) from payments'), '1')
        self.assertEqual(sql('select is_paid from orders'), 't')

    def test_payment_rolls_back_if_paid_flag_update_fails(self):
        order = self.served_order()
        sql("""create function test_reject_paid() returns trigger language plpgsql as $$
          begin if new.is_paid then raise exception 'test failure'; end if; return new; end $$;
          create trigger test_paid before update on orders for each row execute function test_reject_paid();""")
        try:
            sql(rpc('chowly_pay_order', order['order_id'], order['total_order_amount']), False)
            self.assertEqual(sql('select count(*) from payments'), '0')
            self.assertEqual(sql('select is_paid from orders'), 'f')
        finally:
            sql('drop trigger test_paid on orders; drop function test_reject_paid();')

    def test_serve_and_cancel_race_has_one_winning_transition(self):
        data = self.order()
        oid = data['order']['order_id']
        sql(rpc('chowly_assign_preparer', oid, data['items'][0]['order_item_id'], 'CHF001'))
        results = self.race([rpc('chowly_serve_order', oid, 'WAI001'), rpc('chowly_cancel_order', oid, 'waiter')])
        self.assertEqual(sum(r.returncode == 0 for r in results), 1)
        self.assertIn(sql('select status from orders'), ['Served', 'Cancelled'])

    def test_feedback_records_both_and_checks_customer(self):
        order = self.order()['order']
        sql(rpc('chowly_submit_feedback', order['order_id'], 'CUS_OTHER', 'Delay', 'Late', 1, None), False)
        data = json.loads(sql(rpc('chowly_submit_feedback', order['order_id'], 'CUS_TEST', 'Delay', 'Late', 1, None)))
        self.assertEqual(data['complaint']['order_id'], data['rating']['order_id'])
        self.assertEqual(sql('select count(*) from complaints'), '1')
        self.assertEqual(sql('select count(*) from ratings'), '1')

    def test_feedback_rolls_back_both_if_rating_insert_fails(self):
        order = self.order()['order']
        sql("""create function test_reject_rating() returns trigger language plpgsql as $$
          begin raise exception 'test failure'; end $$;
          create trigger test_rating before insert on ratings for each row execute function test_reject_rating();""")
        try:
            sql(rpc('chowly_submit_feedback', order['order_id'], 'CUS_TEST', 'Delay', 'Late', 1, None), False)
            self.assertEqual(sql('select count(*) from complaints'), '0')
            self.assertEqual(sql('select count(*) from ratings'), '0')
        finally:
            sql('drop trigger test_rating on ratings; drop function test_reject_rating();')

    def test_missing_order_is_not_found(self):
        self.assertIn('P0002', sql(rpc('chowly_pay_order', 'missing', 100), False))

    def test_public_database_roles_cannot_access_tables_or_functions(self):
        self.assertEqual(sql("select has_table_privilege('anon','orders','select')"), 'f')
        self.assertEqual(sql("select has_function_privilege('anon','chowly_pay_order(text,numeric)','execute')"), 'f')
        self.assertEqual(sql("select has_function_privilege('authenticated','chowly_place_order(text,text,jsonb)','execute')"), 'f')

    def test_server_role_can_execute_workflows_after_public_access_is_revoked(self):
        data = json.loads(sql("set role service_role; " + rpc('chowly_place_order', 'CUS_TEST', 'RES001', [{'menuItemId': 'MIT001', 'quantity': 1}])))
        self.assertEqual(data['order']['total_order_amount'], 14700)
        self.assertEqual(sql("set role service_role; select count(*) from orders"), '1')


if __name__ == '__main__':
    unittest.main(verbosity=2)
