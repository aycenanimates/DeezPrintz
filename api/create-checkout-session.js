// Vercel serverless function.
// Place this file at /api/create-checkout-session.js in your repo root
// (the same repo that has your index.html), then set STRIPE_SECRET_KEY
// as an environment variable in the Vercel dashboard — never put it in
// the HTML file itself.

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { items, discountPercent } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'No items provided' });
      return;
    }

    const discount = Number(discountPercent) > 0 ? Number(discountPercent) / 100 : 0;

    const line_items = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: `Spiral Fidget Cone — ${item.color}` },
        unit_amount: Math.round(item.unitPrice * (1 - discount) * 100), // cents
      },
      quantity: item.quantity,
    }));

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'], // Apple Pay / Google Pay appear automatically here
      line_items,
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
