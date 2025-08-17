-- RLS Test Queries - Run these to verify multi-tenant isolation
-- These queries should return 0 rows when run with different auth.uid() values

-- Test 1: Properties isolation
-- This should return 0 rows when auth.uid() belongs to a different agency
SELECT COUNT(*) as properties_leak_test FROM properties 
WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid());

-- Test 2: Contracts isolation
-- This should return 0 rows when auth.uid() belongs to a different agency
SELECT COUNT(*) as contracts_leak_test FROM contracts 
WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid());

-- Test 3: Proposals isolation
-- This should return 0 rows when auth.uid() belongs to a different agency
SELECT COUNT(*) as proposals_leak_test FROM proposals 
WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid());

-- Test 4: User profiles isolation
-- This should return 0 rows when auth.uid() belongs to a different agency
SELECT COUNT(*) as user_profiles_leak_test FROM user_profiles 
WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid());

-- Test 5: Activity logs isolation
-- This should return 0 rows when auth.uid() belongs to a different agency
SELECT COUNT(*) as activity_logs_leak_test FROM activity_logs 
WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid());

-- Test 6: Notifications isolation
-- This should return 0 rows when auth.uid() belongs to a different agency
SELECT COUNT(*) as notifications_leak_test FROM notifications 
WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid());

-- Summary test - All should return 0
SELECT 
  'PASS' as test_result 
WHERE NOT EXISTS (
  SELECT 1 FROM properties WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid())
  UNION ALL
  SELECT 1 FROM contracts WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid())
  UNION ALL
  SELECT 1 FROM proposals WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid())
  UNION ALL
  SELECT 1 FROM user_profiles WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid())
  UNION ALL
  SELECT 1 FROM activity_logs WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid())
  UNION ALL
  SELECT 1 FROM notifications WHERE agency_id != (SELECT agency_id FROM user_profiles WHERE user_id = auth.uid())
);
