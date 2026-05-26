# shareables/

Pre-made bits for distributing the Mélange invitation across the
channels guests are most likely to receive it on — WhatsApp, SMS,
email, and printed cards. Each file is meant to be opened, lightly
edited (e.g., the `{{Name}}` placeholder), and forwarded as-is.

## What's in here

| File | What it is | Where to use |
|------|------------|--------------|
| [`share-card.png`](share-card.png) | 1200×630 branded preview card (Open Graph spec) | Already wired into `index.html` as `og:image`. WhatsApp / Telegram / Facebook / iMessage / Slack auto-render this when the live URL is pasted into a chat — no need to attach it manually. Kept here for re-uploads and visual reference. |
| [`qr-code.png`](qr-code.png) | 820×820 QR code in the invitation's burgundy-on-cream palette | Drop into a printed card, a WhatsApp story, or anywhere a guest can scan instead of typing the URL. Scans to the live site. |
| [`whatsapp.md`](whatsapp.md) | WhatsApp message bodies — a warm/personal variant and a short one-liner | Paste either into a WhatsApp chat. The URL inside expands into the share-card preview automatically. |
| [`sms.md`](sms.md) | Single-line SMS body | Stays under the 160-char limit so it fits in one segment. |
| [`email.md`](email.md) | Suggested email subject + plain-text body | Modern mail clients render a rich preview of the URL using the same Open Graph tags WhatsApp uses, so no attachment needed. |

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
file — and update every other message file in this folder that
hardcodes the URL.
