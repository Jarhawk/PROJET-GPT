# Feedback utilisateur

Le module Feedback permet aux utilisateurs de transmettre facilement leurs remarques.

## Table `feedback`

```sql
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid references mamas(id),
  user_id uuid references utilisateurs(id),
  module text,
  message text,
  urgence text,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_feedback_mama_id on feedback(mama_id);
create index if not exists idx_feedback_actif on feedback(actif);
create index if not exists idx_feedback_updated_at on feedback(updated_at);
```

L'index `idx_feedback_updated_at` permet de récupérer rapidement les derniers
messages publiés.

La politique RLS limite l'accès aux utilisateurs de la même structure :

```sql
alter table feedback enable row level security;
alter table feedback force row level security;
drop policy if exists feedback_all on feedback;
create policy feedback_all on feedback
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
```

## Hook `useFeedback`

Le hook `useFeedback` fournit `fetchFeedback` et `addFeedback` pour charger et envoyer des messages.
Il filtre automatiquement sur `mama_id` et `actif`.

```js
import { useFeedback } from "@/hooks/useFeedback";

function sendExample() {
  const { addFeedback } = useFeedback();
  addFeedback({
    module: "Inventaire",
    message: "Erreur interface",
    urgence: "elevee",
  });
}
```

## Page Feedback

La page `/feedback` liste les messages existants et propose un formulaire d'envoi.
L'accès est protégé par le droit `feedback` et le lien n'apparaît dans la sidebar que pour les utilisateurs autorisés.
