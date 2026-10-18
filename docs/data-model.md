
# QuickNotes Data Model

## 1. Database choice

QuickNotes will use a relational SQL database such as PostgreSQL.

Notes belong to users, and tags can be shared across multiple notes
owned by a user. Foreign keys and constraints help preserve these
relationships. SQL also supports joins, transactions and structured
queries needed for reliable note management.

## 2. Entities and columns

### users

| Column | Type | Key / rule |
|---|---|---|
| id | BIGINT | Primary key, generated |
| email | VARCHAR(255) | Unique, not null |
| password_hash | VARCHAR(255) | Not null |
| created_at | TIMESTAMPTZ | Not null, default current time |

### notes

| Column | Type | Key / rule |
|---|---|---|
| id | BIGINT | Primary key, generated |
| user_id | BIGINT | Foreign key to users.id |
| title | VARCHAR(100) | Not null |
| body | TEXT | Nullable |
| created_at | TIMESTAMPTZ | Not null, default current time |
| updated_at | TIMESTAMPTZ | Not null, default current time |

### tags

| Column | Type | Key / rule |
|---|---|---|
| id | BIGINT | Primary key, generated |
| user_id | BIGINT | Foreign key to users.id |
| name | VARCHAR(50) | Not null |
| created_at | TIMESTAMPTZ | Not null, default current time |

A tag name must be unique for each user.

### note_tags

| Column | Type | Key / rule |
|---|---|---|
| note_id | BIGINT | Primary key component and foreign key |
| tag_id | BIGINT | Primary key component and foreign key |
| created_at | TIMESTAMPTZ | Not null, default current time |

The composite primary key (note_id, tag_id) prevents attaching the
same tag to the same note more than once.

## 3. Relationships

- One user can own many notes: users to notes is one-to-many.
- One user can own many tags: users to tags is one-to-many.
- One note can have many tags, and one tag can be applied to many
  notes: notes to tags is many-to-many.
- note_tags implements the many-to-many relationship using two
  foreign keys.

## 4. CREATE TABLE statements

The following PostgreSQL statements create all four tables.

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tag_per_user UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, tag_id)
);
```

## 5. Indexes

```sql
CREATE INDEX idx_notes_user_created
ON notes (user_id, created_at DESC);

CREATE INDEX idx_note_tags_tag
ON note_tags (tag_id);
```

The first index helps retrieve a user's newest notes efficiently.
The second helps find notes associated with a particular tag.

The primary keys and unique constraints also create supporting indexes
in PostgreSQL.

## 6. Example queries

### Query 1: List the newest notes for a user

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 20;
```

### Query 2: Join notes to their tags

```sql
SELECT n.id, n.title, t.name AS tag_name
FROM notes AS n
JOIN note_tags AS nt ON nt.note_id = n.id
JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = 1
ORDER BY n.id;
```

### Query 3: Count notes for each user

```sql
SELECT u.id, u.email, COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
GROUP BY u.id, u.email
ORDER BY note_count DESC;
```

### Query 4: Create a note

```sql
INSERT INTO notes (user_id, title, body)
VALUES (1, 'Study plan', 'Revise chemistry')
RETURNING id, title, body, created_at;
```

## 7. SQL versus NoSQL

SQL is the preferred choice because QuickNotes has clear relationships
between users, notes and tags. Foreign keys, unique constraints and
transactions help maintain data integrity. PostgreSQL can support a
large user base with appropriate indexing, connection pooling, caching,
read replicas and query optimization.

A document-oriented NoSQL database could offer flexible note structures,
but that flexibility is not essential for the current requirements.
The relationships and integrity rules make a relational model a
sensible starting point.
