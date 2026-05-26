# shareables/

Pre-made bits for distributing the Mélange invitation across the
channels guests are most likely to receive it on — WhatsApp, SMS,
email, and printed cards. Each file is meant to be opened, lightly
edited (e.g., the `{{Name}}` placeholder), and forwarded as-is.

## What's in here

| File | What it is | Where to use |
|------|------------|--------------|
| `share-card.png` | 1200×630 branded preview card (Open Graph spec) | Already wired into `index.html` as `og:image`. WhatsApp / Facebook / iMessage / Slack auto-render this when the live URL is pasted into a chat — you don't need to attach it manually. Keep a copy here for re-uploads and visual reference. |
| `qr-code.png` | 820×820 QR code in the invitation's burgundy-on-cream palette | Drop into a printed card, a WhatsApp story, or anywhere a guest can scan instead of typing the URL. Scans to the live site. |
| `whatsapp-message.txt` | Warm personal WhatsApp body (with `{{Name}}` placeholder) | Replace the placeholder, paste into a WhatsApp chat. The site URL inside it will automatically expand into the share-card preview. |
| `whatsapp-message-short.txt` | One-line WhatsApp variant | When something briefer feels right — e.g., to acquaintances. |
| `sms-message.txt` | Single-line SMS body | Stays under the 160-char SMS limit. |
| `email-subject.txt` | Suggested email subject line | Paste into your mail client's Subject field. |
| `email-body.txt` | Plain-text email body (with `{{Name}}` placeholder) | Paste into the body. Modern mail clients (Apple Mail, Gmail's app) will render a rich preview of the URL using the same Open Graph tags. |

## URL of the live site

```
https://shivendrasinghtanwar.github.io/melange-26/
```

## Regenerating the share card

The PNG in this folder is a copy of `public/og-image.png`, which is
the file actually served as the Open Graph image on the live site. If
the design needs an update, regenerate `og-image.png` first (the
source HTML for it isn't committed — it was rendered ad-hoc via
headless Chrome), then refresh this copy:

```bash
cp public/og-image.png shareables/share-card.png
```

## Regenerating the QR code

QR was produced with the `qrcode` Python package, branded burgundy on
cream:

```bash
pip install "qrcode[pil]"
python <<EOF
import qrcode
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,
                   box_size=20, border=4)
qr.add_data("https://shivendrasinghtanwar.github.io/melange-26/")
qr.make(fit=True)
qr.make_image(fill_color=(92,26,43), back_color=(250,241,228)) \
   .save("shareables/qr-code.png")
EOF
```

If the live URL ever changes (e.g., custom domain), regenerate this
file — and update every other text file in this folder that hardcodes
the URL.
