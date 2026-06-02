# Profile Lite Old Profile Gap Fix

Date: 2026-06-02

Reference route: `/profile-old`
Target route: `/profile/mandalas` and Profile Lite non-mandala tabs.

## Gap List Before Patch

- Mandala constructor object placement/order drifted from the old implementation: Lite used a generic radial `powerSource` renderer for all formats, losing old zodiac sign classes, zodiac plus slot IDs/classes, star ray classes, chess top-row plus board layout, business three-vertex layout, and DAO element order/classes.
- DAO RI source hierarchy was flattened: Lite exposed `ДАО РИ` as a simple group label/category filter instead of the old level -> step hierarchy backed by `reikiLevels`.
- Right Power Place rail did not match the old design closely enough: Lite used simplified panels and missed the old `powerCommandRail`, `mandalaFieldLayoutSwitch`, `coverSelector`, `coverLayerTabs`, `coverPreviewWrap`, and `coverVariantList` structure.
- Non-mandala Lite tabs had old wrapper classes, but their old-cabinet parity was only guarded by broad class checks. Materials/services/orders/chats still need stricter checks that the existing old cabinet shell remains left/center/right and does not regress while keeping Lite data forms.

## Patch Principle

Do not invent a new Profile Lite layout. Copy or mirror the already implemented `/profile-old` behavior/layout where the old route has a corresponding block, while preserving the stable Lite shell, route-backed tabs, `ProfileLiteImagePicker`, auth/bootstrap, and public routes.
