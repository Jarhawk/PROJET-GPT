# Notifications Helpers

The `useNotifications` hook in `src/hooks/useNotifications.js` simplifies working with the `notifications` table.

## createNotification

```js
const { data, error } = await createNotification({ titre, texte, lien });
```

Inserts a new notification for the current user. You can target a different user by passing `user_id`.

## fetchNotifications

```js
const list = await fetchNotifications({ type: 'info' });
```

Retrieves all notifications filtered by type and ordered by creation date.

## markAsRead

```js
await markAsRead(id);
```

Marks the notification with the given `id` as read.

## markAllAsRead

```js
await markAllAsRead();
```

Sets the `lu` flag to true for all unread notifications of the current user.

## fetchUnreadCount

```js
const count = await fetchUnreadCount();
```

Returns the number of unread notifications.

## deleteNotification

```js
await deleteNotification(id);
```

Deletes the specified notification from the table and removes it from the local state.

## updateNotification

```js
const { data, error } = await updateNotification(id, { texte: 'Updated' });
```

Updates the given notification with the provided fields and syncs the local state. Returns the updated row and any Supabase error.

## getNotification

```js
const { data, error } = await getNotification(id);
```

Fetches a single notification by id and updates the local items array.

## sendEmailNotification

```js
const { data, error } = await sendEmailNotification('template', { key: 'value' });
```

Triggers the `send_email_notification` RPC with the provided template and parameters.

## sendWebhook

```js
const { data, error } = await sendWebhook(payload);
```

Calls the `send_notification_webhook` RPC with an arbitrary payload.

## subscribeToNotifications

```js
const unsubscribe = subscribeToNotifications((notif) => {
  console.log('new notification', notif);
});
```

Registers a realtime listener for new notifications of the current user. The
callback receives the inserted row. Call the returned function to unsubscribe.
