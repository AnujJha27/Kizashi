# Kizashi private source frames

This is a local Chrome/Edge extension for your own devices. It removes only
`X-Frame-Options` and `Content-Security-Policy` from responses loaded as
subframes from Kizashi's allowlisted source domains, including Marugoto Plus.
It does not affect source pages opened directly in a tab.

Install it locally:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this directory: `browser/kizashi-private-frame-unlocker`.
5. Reload Kizashi, then try **View here** again.

This does not bypass provider login, third-party-cookie restrictions, or
JavaScript failures. If a frame is still blank, use **Open original source**.
Do not publish this extension or install it on devices you do not control.
