Redesign the Messages screen and More section in the mobile app with these specific visual changes:

Messages Screen
Problem: All conversations are currently rendered inside a single card/container with only hairline dividers between them — they look like one long block instead of individual items.

Fix — Individual conversation cards:

Remove the shared wrapper card. Render each conversation as its own standalone card with border-radius: 20px, a 1px border, and a small drop shadow.
Add gap: 11px between cards (use flex-column or a list with spacing — no dividers).
Unread conversations get: a 4px colored left-edge accent bar (absolutely positioned, full height), a tinted border using the channel color at ~22% opacity, and a stronger box-shadow (0 6px 18px rgba(..., 0.09)). Read conversations get a neutral border and minimal shadow.
Fix — Channel pill:

Below the sender name, add a small uppercase pill label showing the channel: SMS (violet), Email (blue), WhatsApp (green). Use a soft background tint matching the color.
Fix — Unread badge:

Move the unread count badge (20px circle) to the bottom-right of the message preview row. Color it to match the channel color (not a generic gradient).
Fix — Timestamp:

Color the timestamp to match the channel color when unread; muted grey when read.
Add white-space: nowrap so it never wraps.
Fix — Filter chips row:

Add a horizontally scrollable filter chip row above the conversation list: All · Unread · SMS · Email · WhatsApp.
The Unread chip should show the live unread count as a badge.
Update header subtitle to show "N unread · SMS, Email & WhatsApp in one inbox."
Fix — Channel icon badge on avatar:

Keep the small channel icon badge on the avatar (bottom-right corner), but give it a white circular background with a subtle shadow so it reads clearly against all avatar colors.
More Section (bottom sheet)
Problem: All menu items use the same violet icon tile color — the three categories (Operations, Growth, Tools) look identical and are hard to distinguish.

Fix — Color-code each category:

Operations → use the app's primary violet color for icon tiles
Growth → use the accent/peach color for icon tiles
Tools → use the info/blue color for icon tiles
Each icon tile should use the category's color as the icon stroke/fill, and a soft tint of that color as the tile background.

Fix — Section labels:

Add a small 6px colored dot (matching the category color) to the left of each section label.
Increase section label font-weight to 700.
Fix — Item cards:

Slightly increase card padding and border-radius (16px). Add a 1px border and 0 1px 2px shadow so each tile feels like a distinct tappable surface.
Item label font-weight 600 (up from 500).
Fix — Search bar:

Style the "Jump to anything" search bar with a background: <bg color> (slightly inset, not surface), and add a ⌘K shortcut pill on the right.
Apply these changes while keeping all existing functionality, navigation, and data intact. Match the existing palette and spacing tokens already in use in the app.