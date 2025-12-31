import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';
import webpush from 'npm:web-push@3.6.7';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const PREFIX = '/make-server-56eb46ed';

// Generate VAPID keys if they don't exist
async function getVapidKeys() {
  let keys = await kv.get('vapid:keys');
  
  if (!keys) {
    keys = webpush.generateVAPIDKeys();
    await kv.set('vapid:keys', keys);
    console.log('Generated new VAPID keys');
  }
  
  return keys;
}

// Initialize web-push
const initWebPush = async () => {
  const keys = await getVapidKeys();
  webpush.setVapidDetails(
    'mailto:medstock@example.com',
    keys.publicKey,
    keys.privateKey
  );
  return keys;
};

// Get VAPID public key
app.get(`${PREFIX}/vapid-public-key`, async (c) => {
  try {
    const keys = await getVapidKeys();
    return c.json({ publicKey: keys.publicKey });
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    return c.json({ error: 'Failed to get VAPID key' }, 500);
  }
});

// Subscribe to push notifications
app.post(`${PREFIX}/subscribe`, async (c) => {
  try {
    const { subscription } = await c.req.json();
    
    // Store subscription in database
    const subscriptionId = `subscription:${Date.now()}`;
    await kv.set(subscriptionId, {
      ...subscription,
      createdAt: new Date().toISOString(),
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return c.json({ error: 'Failed to save subscription' }, 500);
  }
});

// Unsubscribe from push notifications
app.post(`${PREFIX}/unsubscribe`, async (c) => {
  try {
    const { endpoint } = await c.req.json();
    
    // Find and delete subscription
    const subscriptions = await kv.getByPrefix('subscription:');
    for (const sub of subscriptions) {
      if (sub.endpoint === endpoint) {
        const keys = Object.keys(sub);
        if (keys.length > 0) {
          await kv.del(keys[0]);
        }
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return c.json({ error: 'Failed to unsubscribe' }, 500);
  }
});

// Send push notification to all subscribers
app.post(`${PREFIX}/send-notification`, async (c) => {
  try {
    await initWebPush();
    const { title, body, tag } = await c.req.json();
    
    // Get all subscriptions
    const subscriptions = await kv.getByPrefix('subscription:');
    
    const payload = JSON.stringify({
      title,
      body,
      tag,
      icon: '/favicon.ico',
    });
    
    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        webpush.sendNotification(sub, payload).catch(err => {
          console.error('Failed to send to subscription:', err);
          // If subscription is invalid, we could delete it here
          return null;
        })
      )
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    return c.json({ 
      success: true, 
      sent: successful,
      total: subscriptions.length 
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return c.json({ error: 'Failed to send notifications' }, 500);
  }
});

// Get all medicines
app.get(`${PREFIX}/medicines`, async (c) => {
  try {
    const medicines = await kv.getByPrefix('medicine:');
    return c.json({ medicines: medicines || [] });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return c.json({ error: 'Failed to fetch medicines' }, 500);
  }
});

// Add a new medicine
app.post(`${PREFIX}/medicines`, async (c) => {
  try {
    const medicine = await c.req.json();
    const id = Date.now().toString();
    const medicineData = {
      ...medicine,
      id,
      createdAt: new Date().toISOString(),
      notificationSent: false,
    };
    
    await kv.set(`medicine:${id}`, medicineData);
    return c.json({ medicine: medicineData }, 201);
  } catch (error) {
    console.error('Error adding medicine:', error);
    return c.json({ error: 'Failed to add medicine' }, 500);
  }
});

// Update a medicine
app.put(`${PREFIX}/medicines/:id`, async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`medicine:${id}`);
    if (!existing) {
      return c.json({ error: 'Medicine not found' }, 404);
    }
    
    // Reset notification flag if stock is increased above threshold
    const resetNotification = updates.currentStock && 
      updates.currentStock > (updates.lowStockThreshold || existing.lowStockThreshold);
    
    const updated = {
      ...existing,
      ...updates,
      notificationSent: resetNotification ? false : (updates.notificationSent ?? existing.notificationSent),
    };
    
    await kv.set(`medicine:${id}`, updated);
    return c.json({ medicine: updated });
  } catch (error) {
    console.error('Error updating medicine:', error);
    return c.json({ error: 'Failed to update medicine' }, 500);
  }
});

// Delete a medicine
app.delete(`${PREFIX}/medicines/:id`, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`medicine:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    return c.json({ error: 'Failed to delete medicine' }, 500);
  }
});

// Batch update medicines (for auto-decrement)
app.post(`${PREFIX}/medicines/batch-update`, async (c) => {
  try {
    const { medicines } = await c.req.json();
    
    if (!Array.isArray(medicines)) {
      return c.json({ error: 'Invalid medicines data' }, 400);
    }
    
    const keys = medicines.map(med => `medicine:${med.id}`);
    const values = medicines;
    await kv.mset(keys, values);
    
    return c.json({ success: true, count: medicines.length });
  } catch (error) {
    console.error('Error batch updating medicines:', error);
    return c.json({ error: 'Failed to batch update medicines' }, 500);
  }
});

Deno.serve(app.fetch);