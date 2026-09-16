# Security Specification for JadwalKu Firestore

## 1. Data Invariants
1. **User Isolation**: A user can only access, read, write, update, and delete their own profile (`/users/{userId}`) and their own schedule items (`/users/{userId}/schedules/{scheduleId}`).
2. **Identity Integrity**: `userId` in `request.resource.data` must match `request.auth.uid`.
3. **Immutability**: `userId` and `id` must be immutable on update (`incoming().userId == existing().userId`).
4. **Path Variable Hardening**: Document IDs `{userId}` and `{scheduleId}` must conform to regex `^[a-zA-Z0-9_\-]+$` and length `<= 128`.
5. **Schema & Boundary Checks**:
   - `hari` must be one of: `['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']`.
   - `jam` string size `<= 60`.
   - `startHour` number `0-23`, `startMinute` number `0-59`.
   - `endHour` number `0-24`, `endMinute` number `0-59`.
   - `kegiatan` string size `<= 200`.
   - `keterangan` string size `<= 500`.
   - `kategori` must be one of: `['sekolah', 'ibadah_rehat', 'olahraga', 'belajar', 'bimbel', 'animasi', 'santai', 'lainnya']`.

## 2. The "Dirty Dozen" Payloads (All MUST be Rejected)
1. **Unauthenticated Write**: An unauthenticated request (`auth == null`) attempting to write to `/users/user123/schedules/sched1`.
2. **Cross-User Snooping**: User `attacker` attempting `get` or `list` on `/users/victim/schedules`.
3. **Cross-User Hijack Write**: User `attacker` attempting `create` on `/users/victim/schedules/sched1`.
4. **Identity Spoofing**: User `user1` creating a schedule where `userId: "admin_user"`.
5. **ID Poisoning Attack**: Attempting to write with an invalid `{scheduleId}` (e.g. 2000 chars of junk with special symbols).
6. **Owner Mutation**: User attempting to update a schedule item modifying `userId` from `"user1"` to `"user2"`.
7. **Shadow Field Injection**: Payload contains an unauthorized field `{ ..., "isAdmin": true }`.
8. **String Bomb (Denial of Wallet)**: `kegiatan` field containing 50,000 characters.
9. **Illegal Enum Value**: `hari` set to `"InvalidDay"` or `kategori` set to `"malicious_category"`.
10. **Missing Required Fields**: Schedule creation payload missing `kegiatan` or `jam`.
11. **Type Poisoning**: `jam` passed as a boolean `true` instead of a string.
12. **Global Wildcard Bypass**: Attempting to read or write to arbitrary collections `/any_other_path/doc`.
