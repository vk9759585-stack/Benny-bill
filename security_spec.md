# Security Specification

## 1. Data Invariants

1. **Staff Authenticated Access ONLY:** Only authenticated staff or Google-logged-in users can view, modify, or insert tables, menu items, past orders, or staff roles.
2. **Immutability of Historical Bills:** A past order, once logged, is completely immutable (cannot be updated or deleted).
3. **Table Key Safety:** A table status must always belong to 'available', 'occupied', or 'reserved'.
4. **Verified Actions Limit:** Only verified staff can mutate active states, avoiding self-allocated permissions or injecting invalid formats into IDs.

---

## 2. The "Dirty Dozen" Payloads (Exploit Payloads)

Here are any malicious attempts to break data invariants. These must register **PERMISSION_DENIED**:

1. **Unauthenticated Read on tables**: Accessing `/tables` without an active auth token.
2. **Unauthenticated Write on menuItems**: Attempting to insert a menu offering without any session.
3. **Ghost Status Creation**: Inserting a table with status `'malicious_hacker'`.
4. **Negative Table Capacity**: Inserting a table with capacity `-10`.
5. **Pin Overwriting**: A non-admin user trying to modify another worker's secure PIN in `staffUsers`.
6. **Past Order Tampering**: Modifying the historical grand-total amount of a registered order.
7. **Bypass Billing Total**: Creating an order without any items but a massive subtotal key of ₹999999.0.
8. **Malicious ID Injection**: Creating a table with ID consisting of 1.5KB junk characters.
9. **Role Escalation**: Google login user setting themselves as "Admin" in `staffUsers` during signup if they are unauthorized (e.g. non-manager email).
10. **Menu Description Spam**: Writing a menu item description with over 10,000 characters.
11. **Spoofed CreatedAt Timestamp**: Creating an order with a client-supplied future `timestamp` string rather than server timing.
12. **Historical Erasure**: Attempting to delete a settled past order from the history logs collection.

---

## 3. The Test Runner Spec

The testing specification for `firestore.rules` is validated through ESLint security rules on the configuration file. Tests assure that all operational paths enforce maximum strictness.
