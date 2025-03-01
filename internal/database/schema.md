# Table "public.access_tokens"
```
     Column      |           Type           | Collation | Nullable |                  Default                  
-----------------+--------------------------+-----------+----------+-------------------------------------------
 id              | bigint                   |           | not null | nextval('access_tokens_id_seq'::regclass)
 subject_user_id | integer                  |           | not null | 
 value_sha256    | bytea                    |           | not null | 
 note            | text                     |           | not null | 
 created_at      | timestamp with time zone |           | not null | now()
 last_used_at    | timestamp with time zone |           |          | 
 deleted_at      | timestamp with time zone |           |          | 
 creator_user_id | integer                  |           | not null | 
 scopes          | text[]                   |           | not null | 
Indexes:
    "access_tokens_pkey" PRIMARY KEY, btree (id)
    "access_tokens_value_sha256_key" UNIQUE CONSTRAINT, btree (value_sha256)
    "access_tokens_lookup" hash (value_sha256) WHERE deleted_at IS NULL
Foreign-key constraints:
    "access_tokens_creator_user_id_fkey" FOREIGN KEY (creator_user_id) REFERENCES users(id)
    "access_tokens_subject_user_id_fkey" FOREIGN KEY (subject_user_id) REFERENCES users(id)

```

# Table "public.batch_changes"
```
       Column       |           Type           | Collation | Nullable |                  Default                  
--------------------+--------------------------+-----------+----------+-------------------------------------------
 id                 | bigint                   |           | not null | nextval('batch_changes_id_seq'::regclass)
 name               | text                     |           | not null | 
 description        | text                     |           |          | 
 initial_applier_id | integer                  |           |          | 
 namespace_user_id  | integer                  |           |          | 
 namespace_org_id   | integer                  |           |          | 
 created_at         | timestamp with time zone |           | not null | now()
 updated_at         | timestamp with time zone |           | not null | now()
 closed_at          | timestamp with time zone |           |          | 
 batch_spec_id      | bigint                   |           | not null | 
 last_applier_id    | bigint                   |           |          | 
 last_applied_at    | timestamp with time zone |           | not null | 
Indexes:
    "batch_changes_pkey" PRIMARY KEY, btree (id)
    "batch_changes_namespace_org_id" btree (namespace_org_id)
    "batch_changes_namespace_user_id" btree (namespace_user_id)
Check constraints:
    "batch_changes_has_1_namespace" CHECK ((namespace_user_id IS NULL) <> (namespace_org_id IS NULL))
    "batch_changes_name_not_blank" CHECK (name <> ''::text)
Foreign-key constraints:
    "batch_changes_batch_spec_id_fkey" FOREIGN KEY (batch_spec_id) REFERENCES batch_specs(id) DEFERRABLE
    "batch_changes_initial_applier_id_fkey" FOREIGN KEY (initial_applier_id) REFERENCES users(id) ON DELETE SET NULL DEFERRABLE
    "batch_changes_last_applier_id_fkey" FOREIGN KEY (last_applier_id) REFERENCES users(id) ON DELETE SET NULL DEFERRABLE
    "batch_changes_namespace_org_id_fkey" FOREIGN KEY (namespace_org_id) REFERENCES orgs(id) ON DELETE CASCADE DEFERRABLE
    "batch_changes_namespace_user_id_fkey" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE
Referenced by:
    TABLE "changeset_jobs" CONSTRAINT "changeset_jobs_batch_change_id_fkey" FOREIGN KEY (batch_change_id) REFERENCES batch_changes(id) ON DELETE CASCADE DEFERRABLE
    TABLE "changesets" CONSTRAINT "changesets_owned_by_batch_spec_id_fkey" FOREIGN KEY (owned_by_batch_change_id) REFERENCES batch_changes(id) ON DELETE SET NULL DEFERRABLE
Triggers:
    trig_delete_batch_change_reference_on_changesets AFTER DELETE ON batch_changes FOR EACH ROW EXECUTE FUNCTION delete_batch_change_reference_on_changesets()

```

# Table "public.batch_changes_site_credentials"
```
        Column         |           Type           | Collation | Nullable |                          Default                           
-----------------------+--------------------------+-----------+----------+------------------------------------------------------------
 id                    | bigint                   |           | not null | nextval('batch_changes_site_credentials_id_seq'::regclass)
 external_service_type | text                     |           | not null | 
 external_service_id   | text                     |           | not null | 
 created_at            | timestamp with time zone |           | not null | now()
 updated_at            | timestamp with time zone |           | not null | now()
 credential            | bytea                    |           | not null | 
 encryption_key_id     | text                     |           | not null | ''::text
Indexes:
    "batch_changes_site_credentials_pkey" PRIMARY KEY, btree (id)
    "batch_changes_site_credentials_unique" UNIQUE, btree (external_service_type, external_service_id)
    "batch_changes_site_credentials_credential_idx" btree ((encryption_key_id = ANY (ARRAY[''::text, 'previously-migrated'::text])))

```

# Table "public.batch_spec_resolution_jobs"
```
      Column       |           Type           | Collation | Nullable |                        Default                         
-------------------+--------------------------+-----------+----------+--------------------------------------------------------
 id                | bigint                   |           | not null | nextval('batch_spec_resolution_jobs_id_seq'::regclass)
 batch_spec_id     | integer                  |           |          | 
 allow_unsupported | boolean                  |           | not null | false
 allow_ignored     | boolean                  |           | not null | false
 state             | text                     |           |          | 'queued'::text
 failure_message   | text                     |           |          | 
 started_at        | timestamp with time zone |           |          | 
 finished_at       | timestamp with time zone |           |          | 
 process_after     | timestamp with time zone |           |          | 
 num_resets        | integer                  |           | not null | 0
 num_failures      | integer                  |           | not null | 0
 execution_logs    | json[]                   |           |          | 
 worker_hostname   | text                     |           | not null | ''::text
 last_heartbeat_at | timestamp with time zone |           |          | 
 created_at        | timestamp with time zone |           | not null | now()
 updated_at        | timestamp with time zone |           | not null | now()
Indexes:
    "batch_spec_resolution_jobs_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "batch_spec_resolution_jobs_batch_spec_id_fkey" FOREIGN KEY (batch_spec_id) REFERENCES batch_specs(id) ON DELETE CASCADE DEFERRABLE

```

# Table "public.batch_spec_workspace_execution_jobs"
```
         Column          |           Type           | Collation | Nullable |                             Default                             
-------------------------+--------------------------+-----------+----------+-----------------------------------------------------------------
 id                      | bigint                   |           | not null | nextval('batch_spec_workspace_execution_jobs_id_seq'::regclass)
 batch_spec_workspace_id | integer                  |           |          | 
 state                   | text                     |           |          | 'queued'::text
 failure_message         | text                     |           |          | 
 started_at              | timestamp with time zone |           |          | 
 finished_at             | timestamp with time zone |           |          | 
 process_after           | timestamp with time zone |           |          | 
 num_resets              | integer                  |           | not null | 0
 num_failures            | integer                  |           | not null | 0
 execution_logs          | json[]                   |           |          | 
 worker_hostname         | text                     |           | not null | ''::text
 last_heartbeat_at       | timestamp with time zone |           |          | 
 created_at              | timestamp with time zone |           | not null | now()
 updated_at              | timestamp with time zone |           | not null | now()
 cancel                  | boolean                  |           | not null | false
Indexes:
    "batch_spec_workspace_execution_jobs_pkey" PRIMARY KEY, btree (id)
    "batch_spec_workspace_execution_jobs_cancel" btree (cancel)
Foreign-key constraints:
    "batch_spec_workspace_execution_job_batch_spec_workspace_id_fkey" FOREIGN KEY (batch_spec_workspace_id) REFERENCES batch_spec_workspaces(id) ON DELETE CASCADE DEFERRABLE

```

# Table "public.batch_spec_workspaces"
```
        Column        |           Type           | Collation | Nullable |                      Default                      
----------------------+--------------------------+-----------+----------+---------------------------------------------------
 id                   | bigint                   |           | not null | nextval('batch_spec_workspaces_id_seq'::regclass)
 batch_spec_id        | integer                  |           |          | 
 changeset_spec_ids   | jsonb                    |           |          | '{}'::jsonb
 repo_id              | integer                  |           |          | 
 branch               | text                     |           | not null | 
 commit               | text                     |           | not null | 
 path                 | text                     |           | not null | 
 file_matches         | text[]                   |           | not null | 
 only_fetch_workspace | boolean                  |           | not null | false
 steps                | jsonb                    |           |          | '[]'::jsonb
 created_at           | timestamp with time zone |           | not null | now()
 updated_at           | timestamp with time zone |           | not null | now()
Indexes:
    "batch_spec_workspaces_pkey" PRIMARY KEY, btree (id)
Check constraints:
    "batch_spec_workspaces_steps_check" CHECK (jsonb_typeof(steps) = 'array'::text)
Foreign-key constraints:
    "batch_spec_workspaces_batch_spec_id_fkey" FOREIGN KEY (batch_spec_id) REFERENCES batch_specs(id) ON DELETE CASCADE DEFERRABLE
    "batch_spec_workspaces_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) DEFERRABLE
Referenced by:
    TABLE "batch_spec_workspace_execution_jobs" CONSTRAINT "batch_spec_workspace_execution_job_batch_spec_workspace_id_fkey" FOREIGN KEY (batch_spec_workspace_id) REFERENCES batch_spec_workspaces(id) ON DELETE CASCADE DEFERRABLE

```

# Table "public.batch_specs"
```
      Column       |           Type           | Collation | Nullable |                 Default                 
-------------------+--------------------------+-----------+----------+-----------------------------------------
 id                | bigint                   |           | not null | nextval('batch_specs_id_seq'::regclass)
 rand_id           | text                     |           | not null | 
 raw_spec          | text                     |           | not null | 
 spec              | jsonb                    |           | not null | '{}'::jsonb
 namespace_user_id | integer                  |           |          | 
 namespace_org_id  | integer                  |           |          | 
 user_id           | integer                  |           |          | 
 created_at        | timestamp with time zone |           | not null | now()
 updated_at        | timestamp with time zone |           | not null | now()
Indexes:
    "batch_specs_pkey" PRIMARY KEY, btree (id)
    "batch_specs_rand_id" btree (rand_id)
Check constraints:
    "batch_specs_has_1_namespace" CHECK ((namespace_user_id IS NULL) <> (namespace_org_id IS NULL))
Foreign-key constraints:
    "batch_specs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL DEFERRABLE
Referenced by:
    TABLE "batch_changes" CONSTRAINT "batch_changes_batch_spec_id_fkey" FOREIGN KEY (batch_spec_id) REFERENCES batch_specs(id) DEFERRABLE
    TABLE "batch_spec_resolution_jobs" CONSTRAINT "batch_spec_resolution_jobs_batch_spec_id_fkey" FOREIGN KEY (batch_spec_id) REFERENCES batch_specs(id) ON DELETE CASCADE DEFERRABLE
    TABLE "batch_spec_workspaces" CONSTRAINT "batch_spec_workspaces_batch_spec_id_fkey" FOREIGN KEY (batch_spec_id) REFERENCES batch_specs(id) ON DELETE CASCADE DEFERRABLE
    TABLE "changeset_specs" CONSTRAINT "changeset_specs_batch_spec_id_fkey" FOREIGN KEY (batch_spec_id) REFERENCES batch_specs(id) DEFERRABLE

```

# Table "public.changeset_events"
```
    Column    |           Type           | Collation | Nullable |                   Default                    
--------------+--------------------------+-----------+----------+----------------------------------------------
 id           | bigint                   |           | not null | nextval('changeset_events_id_seq'::regclass)
 changeset_id | bigint                   |           | not null | 
 kind         | text                     |           | not null | 
 key          | text                     |           | not null | 
 created_at   | timestamp with time zone |           | not null | now()
 metadata     | jsonb                    |           | not null | '{}'::jsonb
 updated_at   | timestamp with time zone |           | not null | now()
Indexes:
    "changeset_events_pkey" PRIMARY KEY, btree (id)
    "changeset_events_changeset_id_kind_key_unique" UNIQUE CONSTRAINT, btree (changeset_id, kind, key)
Check constraints:
    "changeset_events_key_check" CHECK (key <> ''::text)
    "changeset_events_kind_check" CHECK (kind <> ''::text)
    "changeset_events_metadata_check" CHECK (jsonb_typeof(metadata) = 'object'::text)
Foreign-key constraints:
    "changeset_events_changeset_id_fkey" FOREIGN KEY (changeset_id) REFERENCES changesets(id) ON DELETE CASCADE DEFERRABLE

```

# Table "public.changeset_jobs"
```
      Column       |           Type           | Collation | Nullable |                  Default                   
-------------------+--------------------------+-----------+----------+--------------------------------------------
 id                | bigint                   |           | not null | nextval('changeset_jobs_id_seq'::regclass)
 bulk_group        | text                     |           | not null | 
 user_id           | integer                  |           | not null | 
 batch_change_id   | integer                  |           | not null | 
 changeset_id      | integer                  |           | not null | 
 job_type          | text                     |           | not null | 
 payload           | jsonb                    |           |          | '{}'::jsonb
 state             | text                     |           |          | 'queued'::text
 failure_message   | text                     |           |          | 
 started_at        | timestamp with time zone |           |          | 
 finished_at       | timestamp with time zone |           |          | 
 process_after     | timestamp with time zone |           |          | 
 num_resets        | integer                  |           | not null | 0
 num_failures      | integer                  |           | not null | 0
 execution_logs    | json[]                   |           |          | 
 created_at        | timestamp with time zone |           | not null | now()
 updated_at        | timestamp with time zone |           | not null | now()
 worker_hostname   | text                     |           | not null | ''::text
 last_heartbeat_at | timestamp with time zone |           |          | 
Indexes:
    "changeset_jobs_pkey" PRIMARY KEY, btree (id)
    "changeset_jobs_bulk_group_idx" btree (bulk_group)
    "changeset_jobs_state_idx" btree (state)
Check constraints:
    "changeset_jobs_payload_check" CHECK (jsonb_typeof(payload) = 'object'::text)
Foreign-key constraints:
    "changeset_jobs_batch_change_id_fkey" FOREIGN KEY (batch_change_id) REFERENCES batch_changes(id) ON DELETE CASCADE DEFERRABLE
    "changeset_jobs_changeset_id_fkey" FOREIGN KEY (changeset_id) REFERENCES changesets(id) ON DELETE CASCADE DEFERRABLE
    "changeset_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE

```

# Table "public.changeset_specs"
```
      Column       |           Type           | Collation | Nullable |                   Default                   
-------------------+--------------------------+-----------+----------+---------------------------------------------
 id                | bigint                   |           | not null | nextval('changeset_specs_id_seq'::regclass)
 rand_id           | text                     |           | not null | 
 raw_spec          | text                     |           | not null | 
 spec              | jsonb                    |           | not null | '{}'::jsonb
 batch_spec_id     | bigint                   |           |          | 
 repo_id           | integer                  |           | not null | 
 user_id           | integer                  |           |          | 
 diff_stat_added   | integer                  |           |          | 
 diff_stat_changed | integer                  |           |          | 
 diff_stat_deleted | integer                  |           |          | 
 created_at        | timestamp with time zone |           | not null | now()
 updated_at        | timestamp with time zone |           | not null | now()
 head_ref          | text                     |           |          | 
 title             | text                     |           |          | 
 external_id       | text                     |           |          | 
Indexes:
    "changeset_specs_pkey" PRIMARY KEY, btree (id)
    "changeset_specs_external_id" btree (external_id)
    "changeset_specs_head_ref" btree (head_ref)
    "changeset_specs_rand_id" btree (rand_id)
    "changeset_specs_title" btree (title)
Foreign-key constraints:
    "changeset_specs_batch_spec_id_fkey" FOREIGN KEY (batch_spec_id) REFERENCES batch_specs(id) DEFERRABLE
    "changeset_specs_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) DEFERRABLE
    "changeset_specs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL DEFERRABLE
Referenced by:
    TABLE "changesets" CONSTRAINT "changesets_changeset_spec_id_fkey" FOREIGN KEY (current_spec_id) REFERENCES changeset_specs(id) DEFERRABLE
    TABLE "changesets" CONSTRAINT "changesets_previous_spec_id_fkey" FOREIGN KEY (previous_spec_id) REFERENCES changeset_specs(id) DEFERRABLE

```

# Table "public.changesets"
```
          Column          |                     Type                     | Collation | Nullable |                Default                 
--------------------------+----------------------------------------------+-----------+----------+----------------------------------------
 id                       | bigint                                       |           | not null | nextval('changesets_id_seq'::regclass)
 batch_change_ids         | jsonb                                        |           | not null | '{}'::jsonb
 repo_id                  | integer                                      |           | not null | 
 created_at               | timestamp with time zone                     |           | not null | now()
 updated_at               | timestamp with time zone                     |           | not null | now()
 metadata                 | jsonb                                        |           |          | '{}'::jsonb
 external_id              | text                                         |           |          | 
 external_service_type    | text                                         |           | not null | 
 external_deleted_at      | timestamp with time zone                     |           |          | 
 external_branch          | text                                         |           |          | 
 external_updated_at      | timestamp with time zone                     |           |          | 
 external_state           | text                                         |           |          | 
 external_review_state    | text                                         |           |          | 
 external_check_state     | text                                         |           |          | 
 diff_stat_added          | integer                                      |           |          | 
 diff_stat_changed        | integer                                      |           |          | 
 diff_stat_deleted        | integer                                      |           |          | 
 sync_state               | jsonb                                        |           | not null | '{}'::jsonb
 current_spec_id          | bigint                                       |           |          | 
 previous_spec_id         | bigint                                       |           |          | 
 publication_state        | text                                         |           |          | 'UNPUBLISHED'::text
 owned_by_batch_change_id | bigint                                       |           |          | 
 reconciler_state         | text                                         |           |          | 'queued'::text
 failure_message          | text                                         |           |          | 
 started_at               | timestamp with time zone                     |           |          | 
 finished_at              | timestamp with time zone                     |           |          | 
 process_after            | timestamp with time zone                     |           |          | 
 num_resets               | integer                                      |           | not null | 0
 closing                  | boolean                                      |           | not null | false
 num_failures             | integer                                      |           | not null | 0
 log_contents             | text                                         |           |          | 
 execution_logs           | json[]                                       |           |          | 
 syncer_error             | text                                         |           |          | 
 external_title           | text                                         |           |          | 
 worker_hostname          | text                                         |           | not null | ''::text
 ui_publication_state     | batch_changes_changeset_ui_publication_state |           |          | 
 last_heartbeat_at        | timestamp with time zone                     |           |          | 
Indexes:
    "changesets_pkey" PRIMARY KEY, btree (id)
    "changesets_repo_external_id_unique" UNIQUE CONSTRAINT, btree (repo_id, external_id)
    "changesets_batch_change_ids" gin (batch_change_ids)
    "changesets_external_state_idx" btree (external_state)
    "changesets_external_title_idx" btree (external_title)
    "changesets_publication_state_idx" btree (publication_state)
    "changesets_reconciler_state_idx" btree (reconciler_state)
Check constraints:
    "changesets_batch_change_ids_check" CHECK (jsonb_typeof(batch_change_ids) = 'object'::text)
    "changesets_external_id_check" CHECK (external_id <> ''::text)
    "changesets_external_service_type_not_blank" CHECK (external_service_type <> ''::text)
    "changesets_metadata_check" CHECK (jsonb_typeof(metadata) = 'object'::text)
    "external_branch_ref_prefix" CHECK (external_branch ~~ 'refs/heads/%'::text)
Foreign-key constraints:
    "changesets_changeset_spec_id_fkey" FOREIGN KEY (current_spec_id) REFERENCES changeset_specs(id) DEFERRABLE
    "changesets_owned_by_batch_spec_id_fkey" FOREIGN KEY (owned_by_batch_change_id) REFERENCES batch_changes(id) ON DELETE SET NULL DEFERRABLE
    "changesets_previous_spec_id_fkey" FOREIGN KEY (previous_spec_id) REFERENCES changeset_specs(id) DEFERRABLE
    "changesets_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE DEFERRABLE
Referenced by:
    TABLE "changeset_events" CONSTRAINT "changeset_events_changeset_id_fkey" FOREIGN KEY (changeset_id) REFERENCES changesets(id) ON DELETE CASCADE DEFERRABLE
    TABLE "changeset_jobs" CONSTRAINT "changeset_jobs_changeset_id_fkey" FOREIGN KEY (changeset_id) REFERENCES changesets(id) ON DELETE CASCADE DEFERRABLE

```

**external_title**: Normalized property generated on save using Changeset.Title()

# Table "public.cm_action_jobs"
```
      Column       |           Type           | Collation | Nullable |                  Default                   
-------------------+--------------------------+-----------+----------+--------------------------------------------
 id                | integer                  |           | not null | nextval('cm_action_jobs_id_seq'::regclass)
 email             | bigint                   |           | not null | 
 state             | text                     |           |          | 'queued'::text
 failure_message   | text                     |           |          | 
 started_at        | timestamp with time zone |           |          | 
 finished_at       | timestamp with time zone |           |          | 
 process_after     | timestamp with time zone |           |          | 
 num_resets        | integer                  |           | not null | 0
 num_failures      | integer                  |           | not null | 0
 log_contents      | text                     |           |          | 
 trigger_event     | integer                  |           |          | 
 worker_hostname   | text                     |           | not null | ''::text
 last_heartbeat_at | timestamp with time zone |           |          | 
 execution_logs    | json[]                   |           |          | 
Indexes:
    "cm_action_jobs_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "cm_action_jobs_email_fk" FOREIGN KEY (email) REFERENCES cm_emails(id) ON DELETE CASCADE
    "cm_action_jobs_trigger_event_fk" FOREIGN KEY (trigger_event) REFERENCES cm_trigger_jobs(id) ON DELETE CASCADE

```

# Table "public.cm_emails"
```
   Column   |           Type           | Collation | Nullable |                Default                
------------+--------------------------+-----------+----------+---------------------------------------
 id         | bigint                   |           | not null | nextval('cm_emails_id_seq'::regclass)
 monitor    | bigint                   |           | not null | 
 enabled    | boolean                  |           | not null | 
 priority   | cm_email_priority        |           | not null | 
 header     | text                     |           | not null | 
 created_by | integer                  |           | not null | 
 created_at | timestamp with time zone |           | not null | now()
 changed_by | integer                  |           | not null | 
 changed_at | timestamp with time zone |           | not null | now()
Indexes:
    "cm_emails_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "cm_emails_changed_by_fk" FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
    "cm_emails_created_by_fk" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    "cm_emails_monitor" FOREIGN KEY (monitor) REFERENCES cm_monitors(id) ON DELETE CASCADE
Referenced by:
    TABLE "cm_action_jobs" CONSTRAINT "cm_action_jobs_email_fk" FOREIGN KEY (email) REFERENCES cm_emails(id) ON DELETE CASCADE
    TABLE "cm_recipients" CONSTRAINT "cm_recipients_emails" FOREIGN KEY (email) REFERENCES cm_emails(id) ON DELETE CASCADE

```

# Table "public.cm_monitors"
```
      Column       |           Type           | Collation | Nullable |                 Default                 
-------------------+--------------------------+-----------+----------+-----------------------------------------
 id                | bigint                   |           | not null | nextval('cm_monitors_id_seq'::regclass)
 created_by        | integer                  |           | not null | 
 created_at        | timestamp with time zone |           | not null | now()
 description       | text                     |           | not null | 
 changed_at        | timestamp with time zone |           | not null | now()
 changed_by        | integer                  |           | not null | 
 enabled           | boolean                  |           | not null | true
 namespace_user_id | integer                  |           |          | 
 namespace_org_id  | integer                  |           |          | 
Indexes:
    "cm_monitors_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "cm_monitors_changed_by_fk" FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
    "cm_monitors_created_by_fk" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    "cm_monitors_org_id_fk" FOREIGN KEY (namespace_org_id) REFERENCES orgs(id) ON DELETE CASCADE
    "cm_monitors_user_id_fk" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE
Referenced by:
    TABLE "cm_emails" CONSTRAINT "cm_emails_monitor" FOREIGN KEY (monitor) REFERENCES cm_monitors(id) ON DELETE CASCADE
    TABLE "cm_queries" CONSTRAINT "cm_triggers_monitor" FOREIGN KEY (monitor) REFERENCES cm_monitors(id) ON DELETE CASCADE

```

# Table "public.cm_queries"
```
    Column     |           Type           | Collation | Nullable |                Default                 
---------------+--------------------------+-----------+----------+----------------------------------------
 id            | bigint                   |           | not null | nextval('cm_queries_id_seq'::regclass)
 monitor       | bigint                   |           | not null | 
 query         | text                     |           | not null | 
 created_by    | integer                  |           | not null | 
 created_at    | timestamp with time zone |           | not null | now()
 changed_by    | integer                  |           | not null | 
 changed_at    | timestamp with time zone |           | not null | now()
 next_run      | timestamp with time zone |           |          | now()
 latest_result | timestamp with time zone |           |          | 
Indexes:
    "cm_queries_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "cm_triggers_changed_by_fk" FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
    "cm_triggers_created_by_fk" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    "cm_triggers_monitor" FOREIGN KEY (monitor) REFERENCES cm_monitors(id) ON DELETE CASCADE
Referenced by:
    TABLE "cm_trigger_jobs" CONSTRAINT "cm_trigger_jobs_query_fk" FOREIGN KEY (query) REFERENCES cm_queries(id) ON DELETE CASCADE

```

# Table "public.cm_recipients"
```
      Column       |  Type   | Collation | Nullable |                  Default                  
-------------------+---------+-----------+----------+-------------------------------------------
 id                | bigint  |           | not null | nextval('cm_recipients_id_seq'::regclass)
 email             | bigint  |           | not null | 
 namespace_user_id | integer |           |          | 
 namespace_org_id  | integer |           |          | 
Indexes:
    "cm_recipients_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "cm_recipients_emails" FOREIGN KEY (email) REFERENCES cm_emails(id) ON DELETE CASCADE
    "cm_recipients_org_id_fk" FOREIGN KEY (namespace_org_id) REFERENCES orgs(id) ON DELETE CASCADE
    "cm_recipients_user_id_fk" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE

```

# Table "public.cm_trigger_jobs"
```
      Column       |           Type           | Collation | Nullable |                   Default                   
-------------------+--------------------------+-----------+----------+---------------------------------------------
 id                | integer                  |           | not null | nextval('cm_trigger_jobs_id_seq'::regclass)
 query             | bigint                   |           | not null | 
 state             | text                     |           |          | 'queued'::text
 failure_message   | text                     |           |          | 
 started_at        | timestamp with time zone |           |          | 
 finished_at       | timestamp with time zone |           |          | 
 process_after     | timestamp with time zone |           |          | 
 num_resets        | integer                  |           | not null | 0
 num_failures      | integer                  |           | not null | 0
 log_contents      | text                     |           |          | 
 query_string      | text                     |           |          | 
 results           | boolean                  |           |          | 
 num_results       | integer                  |           |          | 
 worker_hostname   | text                     |           | not null | ''::text
 last_heartbeat_at | timestamp with time zone |           |          | 
 execution_logs    | json[]                   |           |          | 
Indexes:
    "cm_trigger_jobs_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "cm_trigger_jobs_query_fk" FOREIGN KEY (query) REFERENCES cm_queries(id) ON DELETE CASCADE
Referenced by:
    TABLE "cm_action_jobs" CONSTRAINT "cm_action_jobs_trigger_event_fk" FOREIGN KEY (trigger_event) REFERENCES cm_trigger_jobs(id) ON DELETE CASCADE

```

# Table "public.critical_and_site_config"
```
   Column   |           Type           | Collation | Nullable |                       Default                        
------------+--------------------------+-----------+----------+------------------------------------------------------
 id         | integer                  |           | not null | nextval('critical_and_site_config_id_seq'::regclass)
 type       | critical_or_site         |           | not null | 
 contents   | text                     |           | not null | 
 created_at | timestamp with time zone |           | not null | now()
 updated_at | timestamp with time zone |           | not null | now()
Indexes:
    "critical_and_site_config_pkey" PRIMARY KEY, btree (id)
    "critical_and_site_config_unique" UNIQUE, btree (id, type)

```

# Table "public.discussion_comments"
```
     Column     |           Type           | Collation | Nullable |                     Default                     
----------------+--------------------------+-----------+----------+-------------------------------------------------
 id             | bigint                   |           | not null | nextval('discussion_comments_id_seq'::regclass)
 thread_id      | bigint                   |           | not null | 
 author_user_id | integer                  |           | not null | 
 contents       | text                     |           | not null | 
 created_at     | timestamp with time zone |           | not null | now()
 updated_at     | timestamp with time zone |           | not null | now()
 deleted_at     | timestamp with time zone |           |          | 
 reports        | text[]                   |           | not null | '{}'::text[]
Indexes:
    "discussion_comments_pkey" PRIMARY KEY, btree (id)
    "discussion_comments_author_user_id_idx" btree (author_user_id)
    "discussion_comments_reports_array_length_idx" btree (array_length(reports, 1))
    "discussion_comments_thread_id_idx" btree (thread_id)
Foreign-key constraints:
    "discussion_comments_author_user_id_fkey" FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE RESTRICT
    "discussion_comments_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES discussion_threads(id) ON DELETE CASCADE

```

# Table "public.discussion_mail_reply_tokens"
```
   Column   |           Type           | Collation | Nullable | Default 
------------+--------------------------+-----------+----------+---------
 token      | text                     |           | not null | 
 user_id    | integer                  |           | not null | 
 thread_id  | bigint                   |           | not null | 
 deleted_at | timestamp with time zone |           |          | 
Indexes:
    "discussion_mail_reply_tokens_pkey" PRIMARY KEY, btree (token)
    "discussion_mail_reply_tokens_user_id_thread_id_idx" btree (user_id, thread_id)
Foreign-key constraints:
    "discussion_mail_reply_tokens_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES discussion_threads(id) ON DELETE CASCADE
    "discussion_mail_reply_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT

```

# Table "public.discussion_threads"
```
     Column     |           Type           | Collation | Nullable |                    Default                     
----------------+--------------------------+-----------+----------+------------------------------------------------
 id             | bigint                   |           | not null | nextval('discussion_threads_id_seq'::regclass)
 author_user_id | integer                  |           | not null | 
 title          | text                     |           |          | 
 target_repo_id | bigint                   |           |          | 
 created_at     | timestamp with time zone |           | not null | now()
 archived_at    | timestamp with time zone |           |          | 
 updated_at     | timestamp with time zone |           | not null | now()
 deleted_at     | timestamp with time zone |           |          | 
Indexes:
    "discussion_threads_pkey" PRIMARY KEY, btree (id)
    "discussion_threads_author_user_id_idx" btree (author_user_id)
Foreign-key constraints:
    "discussion_threads_author_user_id_fkey" FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE RESTRICT
    "discussion_threads_target_repo_id_fk" FOREIGN KEY (target_repo_id) REFERENCES discussion_threads_target_repo(id) ON DELETE CASCADE
Referenced by:
    TABLE "discussion_comments" CONSTRAINT "discussion_comments_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES discussion_threads(id) ON DELETE CASCADE
    TABLE "discussion_mail_reply_tokens" CONSTRAINT "discussion_mail_reply_tokens_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES discussion_threads(id) ON DELETE CASCADE
    TABLE "discussion_threads_target_repo" CONSTRAINT "discussion_threads_target_repo_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES discussion_threads(id) ON DELETE CASCADE

```

# Table "public.discussion_threads_target_repo"
```
     Column      |  Type   | Collation | Nullable |                          Default                           
-----------------+---------+-----------+----------+------------------------------------------------------------
 id              | bigint  |           | not null | nextval('discussion_threads_target_repo_id_seq'::regclass)
 thread_id       | bigint  |           | not null | 
 repo_id         | integer |           | not null | 
 path            | text    |           |          | 
 branch          | text    |           |          | 
 revision        | text    |           |          | 
 start_line      | integer |           |          | 
 end_line        | integer |           |          | 
 start_character | integer |           |          | 
 end_character   | integer |           |          | 
 lines_before    | text    |           |          | 
 lines           | text    |           |          | 
 lines_after     | text    |           |          | 
Indexes:
    "discussion_threads_target_repo_pkey" PRIMARY KEY, btree (id)
    "discussion_threads_target_repo_repo_id_path_idx" btree (repo_id, path)
Foreign-key constraints:
    "discussion_threads_target_repo_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE
    "discussion_threads_target_repo_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES discussion_threads(id) ON DELETE CASCADE
Referenced by:
    TABLE "discussion_threads" CONSTRAINT "discussion_threads_target_repo_id_fk" FOREIGN KEY (target_repo_id) REFERENCES discussion_threads_target_repo(id) ON DELETE CASCADE

```

# Table "public.event_logs"
```
      Column       |           Type           | Collation | Nullable |                Default                 
-------------------+--------------------------+-----------+----------+----------------------------------------
 id                | bigint                   |           | not null | nextval('event_logs_id_seq'::regclass)
 name              | text                     |           | not null | 
 url               | text                     |           | not null | 
 user_id           | integer                  |           | not null | 
 anonymous_user_id | text                     |           | not null | 
 source            | text                     |           | not null | 
 argument          | jsonb                    |           | not null | 
 version           | text                     |           | not null | 
 timestamp         | timestamp with time zone |           | not null | 
 feature_flags     | jsonb                    |           |          | 
 cohort_id         | date                     |           |          | 
 public_argument   | jsonb                    |           | not null | '{}'::jsonb
Indexes:
    "event_logs_pkey" PRIMARY KEY, btree (id)
    "event_logs_anonymous_user_id" btree (anonymous_user_id)
    "event_logs_name" btree (name)
    "event_logs_source" btree (source)
    "event_logs_timestamp" btree ("timestamp")
    "event_logs_timestamp_at_utc" btree (date(timezone('UTC'::text, "timestamp")))
    "event_logs_user_id" btree (user_id)
Check constraints:
    "event_logs_check_has_user" CHECK (user_id = 0 AND anonymous_user_id <> ''::text OR user_id <> 0 AND anonymous_user_id = ''::text OR user_id <> 0 AND anonymous_user_id <> ''::text)
    "event_logs_check_name_not_empty" CHECK (name <> ''::text)
    "event_logs_check_source_not_empty" CHECK (source <> ''::text)
    "event_logs_check_version_not_empty" CHECK (version <> ''::text)

```

# Table "public.external_service_repos"
```
       Column        |  Type   | Collation | Nullable | Default 
---------------------+---------+-----------+----------+---------
 external_service_id | bigint  |           | not null | 
 repo_id             | integer |           | not null | 
 clone_url           | text    |           | not null | 
 user_id             | integer |           |          | 
Indexes:
    "external_service_repos_repo_id_external_service_id_unique" UNIQUE CONSTRAINT, btree (repo_id, external_service_id)
    "external_service_repos_idx" btree (external_service_id, repo_id)
    "external_service_user_repos_idx" btree (user_id, repo_id) WHERE user_id IS NOT NULL
Foreign-key constraints:
    "external_service_repos_external_service_id_fkey" FOREIGN KEY (external_service_id) REFERENCES external_services(id) ON DELETE CASCADE DEFERRABLE
    "external_service_repos_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE DEFERRABLE
    "external_service_repos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE

```

# Table "public.external_service_sync_jobs"
```
       Column        |           Type           | Collation | Nullable |                        Default                         
---------------------+--------------------------+-----------+----------+--------------------------------------------------------
 id                  | integer                  |           | not null | nextval('external_service_sync_jobs_id_seq'::regclass)
 state               | text                     |           | not null | 'queued'::text
 failure_message     | text                     |           |          | 
 started_at          | timestamp with time zone |           |          | 
 finished_at         | timestamp with time zone |           |          | 
 process_after       | timestamp with time zone |           |          | 
 num_resets          | integer                  |           | not null | 0
 external_service_id | bigint                   |           |          | 
 num_failures        | integer                  |           | not null | 0
 log_contents        | text                     |           |          | 
 execution_logs      | json[]                   |           |          | 
 worker_hostname     | text                     |           | not null | ''::text
 last_heartbeat_at   | timestamp with time zone |           |          | 
Indexes:
    "external_service_sync_jobs_state_idx" btree (state)
Foreign-key constraints:
    "external_services_id_fk" FOREIGN KEY (external_service_id) REFERENCES external_services(id) ON DELETE CASCADE

```

# Table "public.external_services"
```
      Column       |           Type           | Collation | Nullable |                    Default                    
-------------------+--------------------------+-----------+----------+-----------------------------------------------
 id                | bigint                   |           | not null | nextval('external_services_id_seq'::regclass)
 kind              | text                     |           | not null | 
 display_name      | text                     |           | not null | 
 config            | text                     |           | not null | 
 created_at        | timestamp with time zone |           | not null | now()
 updated_at        | timestamp with time zone |           | not null | now()
 deleted_at        | timestamp with time zone |           |          | 
 last_sync_at      | timestamp with time zone |           |          | 
 next_sync_at      | timestamp with time zone |           |          | 
 namespace_user_id | integer                  |           |          | 
 unrestricted      | boolean                  |           | not null | false
 cloud_default     | boolean                  |           | not null | false
 encryption_key_id | text                     |           | not null | ''::text
Indexes:
    "external_services_pkey" PRIMARY KEY, btree (id)
    "kind_cloud_default" UNIQUE, btree (kind, cloud_default) WHERE cloud_default = true AND deleted_at IS NULL
    "external_services_namespace_user_id_idx" btree (namespace_user_id)
Check constraints:
    "check_non_empty_config" CHECK (btrim(config) <> ''::text)
Foreign-key constraints:
    "external_services_namepspace_user_id_fkey" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE
Referenced by:
    TABLE "external_service_repos" CONSTRAINT "external_service_repos_external_service_id_fkey" FOREIGN KEY (external_service_id) REFERENCES external_services(id) ON DELETE CASCADE DEFERRABLE
    TABLE "external_service_sync_jobs" CONSTRAINT "external_services_id_fk" FOREIGN KEY (external_service_id) REFERENCES external_services(id) ON DELETE CASCADE

```

# Table "public.feature_flag_overrides"
```
      Column       |           Type           | Collation | Nullable | Default 
-------------------+--------------------------+-----------+----------+---------
 namespace_org_id  | integer                  |           |          | 
 namespace_user_id | integer                  |           |          | 
 flag_name         | text                     |           | not null | 
 flag_value        | boolean                  |           | not null | 
 created_at        | timestamp with time zone |           | not null | now()
 updated_at        | timestamp with time zone |           | not null | now()
 deleted_at        | timestamp with time zone |           |          | 
Indexes:
    "feature_flag_overrides_unique_org_flag" UNIQUE CONSTRAINT, btree (namespace_org_id, flag_name)
    "feature_flag_overrides_unique_user_flag" UNIQUE CONSTRAINT, btree (namespace_user_id, flag_name)
    "feature_flag_overrides_org_id" btree (namespace_org_id) WHERE namespace_org_id IS NOT NULL
    "feature_flag_overrides_user_id" btree (namespace_user_id) WHERE namespace_user_id IS NOT NULL
Check constraints:
    "feature_flag_overrides_has_org_or_user_id" CHECK (namespace_org_id IS NOT NULL OR namespace_user_id IS NOT NULL)
Foreign-key constraints:
    "feature_flag_overrides_flag_name_fkey" FOREIGN KEY (flag_name) REFERENCES feature_flags(flag_name) ON DELETE CASCADE
    "feature_flag_overrides_namespace_org_id_fkey" FOREIGN KEY (namespace_org_id) REFERENCES orgs(id) ON DELETE CASCADE
    "feature_flag_overrides_namespace_user_id_fkey" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE

```

# Table "public.feature_flags"
```
   Column   |           Type           | Collation | Nullable | Default 
------------+--------------------------+-----------+----------+---------
 flag_name  | text                     |           | not null | 
 flag_type  | feature_flag_type        |           | not null | 
 bool_value | boolean                  |           |          | 
 rollout    | integer                  |           |          | 
 created_at | timestamp with time zone |           | not null | now()
 updated_at | timestamp with time zone |           | not null | now()
 deleted_at | timestamp with time zone |           |          | 
Indexes:
    "feature_flags_pkey" PRIMARY KEY, btree (flag_name)
Check constraints:
    "feature_flags_rollout_check" CHECK (rollout >= 0 AND rollout <= 10000)
    "required_bool_fields" CHECK (1 =
CASE
    WHEN flag_type = 'bool'::feature_flag_type AND bool_value IS NULL THEN 0
    WHEN flag_type <> 'bool'::feature_flag_type AND bool_value IS NOT NULL THEN 0
    ELSE 1
END)
    "required_rollout_fields" CHECK (1 =
CASE
    WHEN flag_type = 'rollout'::feature_flag_type AND rollout IS NULL THEN 0
    WHEN flag_type <> 'rollout'::feature_flag_type AND rollout IS NOT NULL THEN 0
    ELSE 1
END)
Referenced by:
    TABLE "feature_flag_overrides" CONSTRAINT "feature_flag_overrides_flag_name_fkey" FOREIGN KEY (flag_name) REFERENCES feature_flags(flag_name) ON DELETE CASCADE

```

**bool_value**: Bool value only defined when flag_type is bool

**rollout**: Rollout only defined when flag_type is rollout. Increments of 0.01%

# Table "public.gitserver_repos"
```
        Column         |           Type           | Collation | Nullable |      Default       
-----------------------+--------------------------+-----------+----------+--------------------
 repo_id               | integer                  |           | not null | 
 clone_status          | text                     |           | not null | 'not_cloned'::text
 last_external_service | bigint                   |           |          | 
 shard_id              | text                     |           | not null | 
 last_error            | text                     |           |          | 
 updated_at            | timestamp with time zone |           | not null | now()
 last_fetched          | timestamp with time zone |           | not null | now()
Indexes:
    "gitserver_repos_pkey" PRIMARY KEY, btree (repo_id)
    "gitserver_repos_cloned_status_idx" btree (repo_id) WHERE clone_status = 'cloned'::text
    "gitserver_repos_cloning_status_idx" btree (repo_id) WHERE clone_status = 'cloning'::text
    "gitserver_repos_last_error_idx" btree (last_error) WHERE last_error IS NOT NULL
    "gitserver_repos_not_cloned_status_idx" btree (repo_id) WHERE clone_status = 'not_cloned'::text
Foreign-key constraints:
    "gitserver_repos_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE

```

# Table "public.global_state"
```
   Column    |  Type   | Collation | Nullable | Default 
-------------+---------+-----------+----------+---------
 site_id     | uuid    |           | not null | 
 initialized | boolean |           | not null | false
Indexes:
    "global_state_pkey" PRIMARY KEY, btree (site_id)

```

# Table "public.insights_query_runner_jobs"
```
      Column       |           Type           | Collation | Nullable |                        Default                         
-------------------+--------------------------+-----------+----------+--------------------------------------------------------
 id                | integer                  |           | not null | nextval('insights_query_runner_jobs_id_seq'::regclass)
 series_id         | text                     |           | not null | 
 search_query      | text                     |           | not null | 
 state             | text                     |           |          | 'queued'::text
 failure_message   | text                     |           |          | 
 started_at        | timestamp with time zone |           |          | 
 finished_at       | timestamp with time zone |           |          | 
 process_after     | timestamp with time zone |           |          | 
 num_resets        | integer                  |           | not null | 0
 num_failures      | integer                  |           | not null | 0
 execution_logs    | json[]                   |           |          | 
 record_time       | timestamp with time zone |           |          | 
 worker_hostname   | text                     |           | not null | ''::text
 last_heartbeat_at | timestamp with time zone |           |          | 
 priority          | integer                  |           | not null | 1
 cost              | integer                  |           | not null | 500
 persist_mode      | persistmode              |           | not null | 'record'::persistmode
Indexes:
    "insights_query_runner_jobs_pkey" PRIMARY KEY, btree (id)
    "insights_query_runner_jobs_cost_idx" btree (cost)
    "insights_query_runner_jobs_priority_idx" btree (priority)
    "insights_query_runner_jobs_processable_priority_id" btree (priority, id) WHERE state = 'queued'::text OR state = 'errored'::text
    "insights_query_runner_jobs_state_btree" btree (state)
Referenced by:
    TABLE "insights_query_runner_jobs_dependencies" CONSTRAINT "insights_query_runner_jobs_dependencies_fk_job_id" FOREIGN KEY (job_id) REFERENCES insights_query_runner_jobs(id) ON DELETE CASCADE

```

See [enterprise/internal/insights/background/queryrunner/worker.go:Job](https://sourcegraph.com/search?q=repo:%5Egithub%5C.com/sourcegraph/sourcegraph%24+file:enterprise/internal/insights/background/queryrunner/worker.go+type+Job&patternType=literal)

**cost**: Integer representing a cost approximation of executing this search query.

**persist_mode**: The persistence level for this query. This value will determine the lifecycle of the resulting value.

**priority**: Integer representing a category of priority for this query. Priority in this context is ambiguously defined for consumers to decide an interpretation.

# Table "public.insights_query_runner_jobs_dependencies"
```
     Column     |            Type             | Collation | Nullable |                               Default                               
----------------+-----------------------------+-----------+----------+---------------------------------------------------------------------
 id             | integer                     |           | not null | nextval('insights_query_runner_jobs_dependencies_id_seq'::regclass)
 job_id         | integer                     |           | not null | 
 recording_time | timestamp without time zone |           | not null | 
Indexes:
    "insights_query_runner_jobs_dependencies_pkey" PRIMARY KEY, btree (id)
    "insights_query_runner_jobs_dependencies_job_id_fk_idx" btree (job_id)
Foreign-key constraints:
    "insights_query_runner_jobs_dependencies_fk_job_id" FOREIGN KEY (job_id) REFERENCES insights_query_runner_jobs(id) ON DELETE CASCADE

```

Stores data points for a code insight that do not need to be queried directly, but depend on the result of a query at a different point

**job_id**: Foreign key to the job that owns this record.

**recording_time**: The time for which this dependency should be recorded at using the parents value.

# Table "public.lsif_configuration_policies"
```
           Column            |  Type   | Collation | Nullable |                         Default                         
-----------------------------+---------+-----------+----------+---------------------------------------------------------
 id                          | integer |           | not null | nextval('lsif_configuration_policies_id_seq'::regclass)
 repository_id               | integer |           |          | 
 name                        | text    |           |          | 
 type                        | text    |           | not null | 
 pattern                     | text    |           | not null | 
 retention_enabled           | boolean |           | not null | 
 retention_duration_hours    | integer |           |          | 
 retain_intermediate_commits | boolean |           | not null | 
 indexing_enabled            | boolean |           | not null | 
 index_commit_max_age_hours  | integer |           |          | 
 index_intermediate_commits  | boolean |           | not null | 
 protected                   | boolean |           | not null | false
Indexes:
    "lsif_configuration_policies_pkey" PRIMARY KEY, btree (id)
    "lsif_configuration_policies_repository_id" btree (repository_id)

```

**index_commit_max_age_hours**: The max age of commits indexed by this configuration policy. If null, the age is unbounded.

**index_intermediate_commits**: If the matching Git object is a branch, setting this value to true will also index all commits on the matching branches. Setting this value to false will only consider the tip of the branch.

**indexing_enabled**: Whether or not this configuration policy affects auto-indexing schedules.

**pattern**: A pattern used to match` names of the associated Git object type.

**protected**: Whether or not this configuration policy is protected from modification of its data retention behavior (except for duration).

**repository_id**: The identifier of the repository to which this configuration policy applies. If absent, this policy is applied globally.

**retain_intermediate_commits**: If the matching Git object is a branch, setting this value to true will also retain all data used to resolve queries for any commit on the matching branches. Setting this value to false will only consider the tip of the branch.

**retention_duration_hours**: The max age of data retained by this configuration policy. If null, the age is unbounded.

**retention_enabled**: Whether or not this configuration policy affects data retention rules.

**type**: The type of Git object (e.g., COMMIT, BRANCH, TAG).

# Table "public.lsif_dependency_indexing_jobs"
```
        Column         |           Type           | Collation | Nullable |                          Default                           
-----------------------+--------------------------+-----------+----------+------------------------------------------------------------
 id                    | integer                  |           | not null | nextval('lsif_dependency_indexing_jobs_id_seq1'::regclass)
 state                 | text                     |           | not null | 'queued'::text
 failure_message       | text                     |           |          | 
 queued_at             | timestamp with time zone |           | not null | now()
 started_at            | timestamp with time zone |           |          | 
 finished_at           | timestamp with time zone |           |          | 
 process_after         | timestamp with time zone |           |          | 
 num_resets            | integer                  |           | not null | 0
 num_failures          | integer                  |           | not null | 0
 execution_logs        | json[]                   |           |          | 
 last_heartbeat_at     | timestamp with time zone |           |          | 
 worker_hostname       | text                     |           | not null | ''::text
 upload_id             | integer                  |           |          | 
 external_service_kind | text                     |           | not null | ''::text
 external_service_sync | timestamp with time zone |           |          | 
Indexes:
    "lsif_dependency_indexing_jobs_pkey1" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "lsif_dependency_indexing_jobs_upload_id_fkey1" FOREIGN KEY (upload_id) REFERENCES lsif_uploads(id) ON DELETE CASCADE

```

**external_service_kind**: Filter the external services for this kind to wait to have synced. If empty, external_service_sync is ignored and no external services are polled for their last sync time.

**external_service_sync**: The sync time after which external services of the given kind will have synced/created any repositories referenced by the LSIF upload that are resolvable.

# Table "public.lsif_dependency_repos"
```
 Column  |  Type  | Collation | Nullable |                      Default                      
---------+--------+-----------+----------+---------------------------------------------------
 id      | bigint |           | not null | nextval('lsif_dependency_repos_id_seq'::regclass)
 name    | text   |           | not null | 
 version | text   |           | not null | 
 scheme  | text   |           | not null | 
Indexes:
    "lsif_dependency_repos_pkey" PRIMARY KEY, btree (id)
    "lsif_dependency_repos_unique_triplet" UNIQUE CONSTRAINT, btree (scheme, name, version)

```

# Table "public.lsif_dependency_syncing_jobs"
```
      Column       |           Type           | Collation | Nullable |                          Default                          
-------------------+--------------------------+-----------+----------+-----------------------------------------------------------
 id                | integer                  |           | not null | nextval('lsif_dependency_indexing_jobs_id_seq'::regclass)
 state             | text                     |           | not null | 'queued'::text
 failure_message   | text                     |           |          | 
 queued_at         | timestamp with time zone |           | not null | now()
 started_at        | timestamp with time zone |           |          | 
 finished_at       | timestamp with time zone |           |          | 
 process_after     | timestamp with time zone |           |          | 
 num_resets        | integer                  |           | not null | 0
 num_failures      | integer                  |           | not null | 0
 execution_logs    | json[]                   |           |          | 
 upload_id         | integer                  |           |          | 
 worker_hostname   | text                     |           | not null | ''::text
 last_heartbeat_at | timestamp with time zone |           |          | 
Indexes:
    "lsif_dependency_indexing_jobs_pkey" PRIMARY KEY, btree (id)
    "lsif_dependency_indexing_jobs_upload_id" btree (upload_id)
Foreign-key constraints:
    "lsif_dependency_indexing_jobs_upload_id_fkey" FOREIGN KEY (upload_id) REFERENCES lsif_uploads(id) ON DELETE CASCADE

```

Tracks jobs that scan imports of indexes to schedule auto-index jobs.

**upload_id**: The identifier of the triggering upload record.

# Table "public.lsif_dirty_repositories"
```
    Column     |           Type           | Collation | Nullable | Default 
---------------+--------------------------+-----------+----------+---------
 repository_id | integer                  |           | not null | 
 dirty_token   | integer                  |           | not null | 
 update_token  | integer                  |           | not null | 
 updated_at    | timestamp with time zone |           |          | 
Indexes:
    "lsif_dirty_repositories_pkey" PRIMARY KEY, btree (repository_id)

```

Stores whether or not the nearest upload data for a repository is out of date (when update_token > dirty_token).

**dirty_token**: Set to the value of update_token visible to the transaction that updates the commit graph. Updates of dirty_token during this time will cause a second update.

**update_token**: This value is incremented on each request to update the commit graph for the repository.

**updated_at**: The time the update_token value was last updated.

# Table "public.lsif_index_configuration"
```
      Column       |  Type   | Collation | Nullable |                       Default                        
-------------------+---------+-----------+----------+------------------------------------------------------
 id                | bigint  |           | not null | nextval('lsif_index_configuration_id_seq'::regclass)
 repository_id     | integer |           | not null | 
 data              | bytea   |           | not null | 
 autoindex_enabled | boolean |           | not null | true
Indexes:
    "lsif_index_configuration_pkey" PRIMARY KEY, btree (id)
    "lsif_index_configuration_repository_id_key" UNIQUE CONSTRAINT, btree (repository_id)
Foreign-key constraints:
    "lsif_index_configuration_repository_id_fkey" FOREIGN KEY (repository_id) REFERENCES repo(id) ON DELETE CASCADE

```

Stores the configuration used for code intel index jobs for a repository.

**autoindex_enabled**: Whether or not auto-indexing should be attempted on this repo. Index jobs may be inferred from the repository contents if data is empty.

**data**: The raw user-supplied [configuration](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.23/-/blob/enterprise/internal/codeintel/autoindex/config/types.go#L3:6) (encoded in JSONC).

# Table "public.lsif_indexes"
```
         Column         |           Type           | Collation | Nullable |                 Default                  
------------------------+--------------------------+-----------+----------+------------------------------------------
 id                     | bigint                   |           | not null | nextval('lsif_indexes_id_seq'::regclass)
 commit                 | text                     |           | not null | 
 queued_at              | timestamp with time zone |           | not null | now()
 state                  | text                     |           | not null | 'queued'::text
 failure_message        | text                     |           |          | 
 started_at             | timestamp with time zone |           |          | 
 finished_at            | timestamp with time zone |           |          | 
 repository_id          | integer                  |           | not null | 
 process_after          | timestamp with time zone |           |          | 
 num_resets             | integer                  |           | not null | 0
 num_failures           | integer                  |           | not null | 0
 docker_steps           | jsonb[]                  |           | not null | 
 root                   | text                     |           | not null | 
 indexer                | text                     |           | not null | 
 indexer_args           | text[]                   |           | not null | 
 outfile                | text                     |           | not null | 
 log_contents           | text                     |           |          | 
 execution_logs         | json[]                   |           |          | 
 local_steps            | text[]                   |           | not null | 
 commit_last_checked_at | timestamp with time zone |           |          | 
 worker_hostname        | text                     |           | not null | ''::text
 last_heartbeat_at      | timestamp with time zone |           |          | 
Indexes:
    "lsif_indexes_pkey" PRIMARY KEY, btree (id)
    "lsif_indexes_commit_last_checked_at" btree (commit_last_checked_at) WHERE state <> 'deleted'::text
    "lsif_indexes_repository_id_commit" btree (repository_id, commit)
Check constraints:
    "lsif_uploads_commit_valid_chars" CHECK (commit ~ '^[a-z0-9]{40}$'::text)

```

Stores metadata about a code intel index job.

**commit**: A 40-char revhash. Note that this commit may not be resolvable in the future.

**docker_steps**: An array of pre-index [steps](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.23/-/blob/enterprise/internal/codeintel/stores/dbstore/docker_step.go#L9:6) to run.

**execution_logs**: An array of [log entries](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.23/-/blob/internal/workerutil/store.go#L48:6) (encoded as JSON) from the most recent execution.

**indexer**: The docker image used to run the index command (e.g. sourcegraph/lsif-go).

**indexer_args**: The command run inside the indexer image to produce the index file (e.g. ['lsif-node', '-p', '.'])

**local_steps**: A list of commands to run inside the indexer image prior to running the indexer command.

**log_contents**: **Column deprecated in favor of execution_logs.**

**outfile**: The path to the index file produced by the index command relative to the working directory.

**root**: The working directory of the indexer image relative to the repository root.

# Table "public.lsif_last_retention_scan"
```
         Column         |           Type           | Collation | Nullable | Default 
------------------------+--------------------------+-----------+----------+---------
 repository_id          | integer                  |           | not null | 
 last_retention_scan_at | timestamp with time zone |           | not null | 
Indexes:
    "lsif_last_retention_scan_pkey" PRIMARY KEY, btree (repository_id)

```

Tracks the last time uploads a repository were checked against data retention policies.

**last_retention_scan_at**: The last time uploads of this repository were checked against data retention policies.

# Table "public.lsif_nearest_uploads"
```
    Column     |  Type   | Collation | Nullable | Default 
---------------+---------+-----------+----------+---------
 repository_id | integer |           | not null | 
 commit_bytea  | bytea   |           | not null | 
 uploads       | jsonb   |           | not null | 
Indexes:
    "lsif_nearest_uploads_repository_id_commit_bytea" btree (repository_id, commit_bytea)
    "lsif_nearest_uploads_uploads" gin (uploads)

```

Associates commits with the complete set of uploads visible from that commit. Every commit with upload data is present in this table.

**commit_bytea**: A 40-char revhash. Note that this commit may not be resolvable in the future.

**uploads**: Encodes an {upload_id => distance} map that includes an entry for every upload visible from the commit. There is always at least one entry with a distance of zero.

# Table "public.lsif_nearest_uploads_links"
```
        Column         |  Type   | Collation | Nullable | Default 
-----------------------+---------+-----------+----------+---------
 repository_id         | integer |           | not null | 
 commit_bytea          | bytea   |           | not null | 
 ancestor_commit_bytea | bytea   |           | not null | 
 distance              | integer |           | not null | 
Indexes:
    "lsif_nearest_uploads_links_repository_id_ancestor_commit_bytea" btree (repository_id, ancestor_commit_bytea)
    "lsif_nearest_uploads_links_repository_id_commit_bytea" btree (repository_id, commit_bytea)

```

Associates commits with the closest ancestor commit with usable upload data. Together, this table and lsif_nearest_uploads cover all commits with resolvable code intelligence.

**ancestor_commit_bytea**: The 40-char revhash of the ancestor. Note that this commit may not be resolvable in the future.

**commit_bytea**: A 40-char revhash. Note that this commit may not be resolvable in the future.

**distance**: The distance bewteen the commits. Parent = 1, Grandparent = 2, etc.

# Table "public.lsif_packages"
```
 Column  |  Type   | Collation | Nullable |                  Default                  
---------+---------+-----------+----------+-------------------------------------------
 id      | integer |           | not null | nextval('lsif_packages_id_seq'::regclass)
 scheme  | text    |           | not null | 
 name    | text    |           | not null | 
 version | text    |           |          | 
 dump_id | integer |           | not null | 
Indexes:
    "lsif_packages_pkey" PRIMARY KEY, btree (id)
    "lsif_packages_dump_id" btree (dump_id)
    "lsif_packages_scheme_name_version_dump_id" btree (scheme, name, version, dump_id)
Foreign-key constraints:
    "lsif_packages_dump_id_fkey" FOREIGN KEY (dump_id) REFERENCES lsif_uploads(id) ON DELETE CASCADE

```

Associates an upload with the set of packages they provide within a given packages management scheme.

**dump_id**: The identifier of the upload that provides the package.

**name**: The package name.

**scheme**: The (export) moniker scheme.

**version**: The package version.

# Table "public.lsif_references"
```
 Column  |  Type   | Collation | Nullable |                   Default                   
---------+---------+-----------+----------+---------------------------------------------
 id      | integer |           | not null | nextval('lsif_references_id_seq'::regclass)
 scheme  | text    |           | not null | 
 name    | text    |           | not null | 
 version | text    |           |          | 
 filter  | bytea   |           | not null | 
 dump_id | integer |           | not null | 
Indexes:
    "lsif_references_pkey" PRIMARY KEY, btree (id)
    "lsif_references_dump_id" btree (dump_id)
    "lsif_references_scheme_name_version_dump_id" btree (scheme, name, version, dump_id)
Foreign-key constraints:
    "lsif_references_dump_id_fkey" FOREIGN KEY (dump_id) REFERENCES lsif_uploads(id) ON DELETE CASCADE

```

Associates an upload with the set of packages they require within a given packages management scheme.

**dump_id**: The identifier of the upload that references the package.

**filter**: A [bloom filter](https://sourcegraph.com/github.com/sourcegraph/sourcegraph@3.23/-/blob/enterprise/internal/codeintel/bloomfilter/bloom_filter.go#L27:6) encoded as gzipped JSON. This bloom filter stores the set of identifiers imported from the package.

**name**: The package name.

**scheme**: The (import) moniker scheme.

**version**: The package version.

# Table "public.lsif_retention_configuration"
```
                 Column                 |  Type   | Collation | Nullable |                         Default                          
----------------------------------------+---------+-----------+----------+----------------------------------------------------------
 id                                     | integer |           | not null | nextval('lsif_retention_configuration_id_seq'::regclass)
 repository_id                          | integer |           | not null | 
 max_age_for_non_stale_branches_seconds | integer |           | not null | 
 max_age_for_non_stale_tags_seconds     | integer |           | not null | 
Indexes:
    "lsif_retention_configuration_pkey" PRIMARY KEY, btree (id)
    "lsif_retention_configuration_repository_id_key" UNIQUE CONSTRAINT, btree (repository_id)
Foreign-key constraints:
    "lsif_retention_configuration_repository_id_fkey" FOREIGN KEY (repository_id) REFERENCES repo(id) ON DELETE CASCADE

```

Stores the retention policy of code intellience data for a repository.

**max_age_for_non_stale_branches_seconds**: The number of seconds since the last modification of a branch until it is considered stale.

**max_age_for_non_stale_tags_seconds**: The nujmber of seconds since the commit date of a tagged commit until it is considered stale.

# Table "public.lsif_uploads"
```
         Column         |           Type           | Collation | Nullable |                Default                 
------------------------+--------------------------+-----------+----------+----------------------------------------
 id                     | integer                  |           | not null | nextval('lsif_dumps_id_seq'::regclass)
 commit                 | text                     |           | not null | 
 root                   | text                     |           | not null | ''::text
 uploaded_at            | timestamp with time zone |           | not null | now()
 state                  | text                     |           | not null | 'queued'::text
 failure_message        | text                     |           |          | 
 started_at             | timestamp with time zone |           |          | 
 finished_at            | timestamp with time zone |           |          | 
 repository_id          | integer                  |           | not null | 
 indexer                | text                     |           | not null | 
 num_parts              | integer                  |           | not null | 
 uploaded_parts         | integer[]                |           | not null | 
 process_after          | timestamp with time zone |           |          | 
 num_resets             | integer                  |           | not null | 0
 upload_size            | bigint                   |           |          | 
 num_failures           | integer                  |           | not null | 0
 associated_index_id    | bigint                   |           |          | 
 committed_at           | timestamp with time zone |           |          | 
 commit_last_checked_at | timestamp with time zone |           |          | 
 worker_hostname        | text                     |           | not null | ''::text
 last_heartbeat_at      | timestamp with time zone |           |          | 
 execution_logs         | json[]                   |           |          | 
 num_references         | integer                  |           |          | 
 expired                | boolean                  |           | not null | false
 last_retention_scan_at | timestamp with time zone |           |          | 
Indexes:
    "lsif_uploads_pkey" PRIMARY KEY, btree (id)
    "lsif_uploads_repository_id_commit_root_indexer" UNIQUE, btree (repository_id, commit, root, indexer) WHERE state = 'completed'::text
    "lsif_uploads_associated_index_id" btree (associated_index_id)
    "lsif_uploads_commit_last_checked_at" btree (commit_last_checked_at) WHERE state <> 'deleted'::text
    "lsif_uploads_committed_at" btree (committed_at) WHERE state = 'completed'::text
    "lsif_uploads_repository_id" btree (repository_id)
    "lsif_uploads_state" btree (state)
    "lsif_uploads_uploaded_at" btree (uploaded_at)
Check constraints:
    "lsif_uploads_commit_valid_chars" CHECK (commit ~ '^[a-z0-9]{40}$'::text)
Referenced by:
    TABLE "lsif_dependency_syncing_jobs" CONSTRAINT "lsif_dependency_indexing_jobs_upload_id_fkey" FOREIGN KEY (upload_id) REFERENCES lsif_uploads(id) ON DELETE CASCADE
    TABLE "lsif_dependency_indexing_jobs" CONSTRAINT "lsif_dependency_indexing_jobs_upload_id_fkey1" FOREIGN KEY (upload_id) REFERENCES lsif_uploads(id) ON DELETE CASCADE
    TABLE "lsif_packages" CONSTRAINT "lsif_packages_dump_id_fkey" FOREIGN KEY (dump_id) REFERENCES lsif_uploads(id) ON DELETE CASCADE
    TABLE "lsif_references" CONSTRAINT "lsif_references_dump_id_fkey" FOREIGN KEY (dump_id) REFERENCES lsif_uploads(id) ON DELETE CASCADE

```

Stores metadata about an LSIF index uploaded by a user.

**commit**: A 40-char revhash. Note that this commit may not be resolvable in the future.

**expired**: Whether or not this upload data is no longer protected by any data retention policy.

**id**: Used as a logical foreign key with the (disjoint) codeintel database.

**indexer**: The name of the indexer that produced the index file. If not supplied by the user it will be pulled from the index metadata.

**last_retention_scan_at**: The last time this upload was checked against data retention policies.

**num_parts**: The number of parts src-cli split the upload file into.

**num_references**: The number of references to this upload data from other upload records (via lsif_references).

**root**: The path for which the index can resolve code intelligence relative to the repository root.

**upload_size**: The size of the index file (in bytes).

**uploaded_parts**: The index of parts that have been successfully uploaded.

# Table "public.lsif_uploads_visible_at_tip"
```
       Column       |  Type   | Collation | Nullable | Default  
--------------------+---------+-----------+----------+----------
 repository_id      | integer |           | not null | 
 upload_id          | integer |           | not null | 
 branch_or_tag_name | text    |           | not null | ''::text
 is_default_branch  | boolean |           | not null | false
Indexes:
    "lsif_uploads_visible_at_tip_repository_id_upload_id" btree (repository_id, upload_id)

```

Associates a repository with the set of LSIF upload identifiers that can serve intelligence for the tip of the default branch.

**branch_or_tag_name**: The name of the branch or tag.

**is_default_branch**: Whether the specified branch is the default of the repository. Always false for tags.

**upload_id**: The identifier of the upload visible from the tip of the specified branch or tag.

# Table "public.names"
```
 Column  |  Type   | Collation | Nullable | Default 
---------+---------+-----------+----------+---------
 name    | citext  |           | not null | 
 user_id | integer |           |          | 
 org_id  | integer |           |          | 
Indexes:
    "names_pkey" PRIMARY KEY, btree (name)
Check constraints:
    "names_check" CHECK (user_id IS NOT NULL OR org_id IS NOT NULL)
Foreign-key constraints:
    "names_org_id_fkey" FOREIGN KEY (org_id) REFERENCES orgs(id) ON UPDATE CASCADE ON DELETE CASCADE
    "names_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE

```

# Table "public.org_invitations"
```
      Column       |           Type           | Collation | Nullable |                   Default                   
-------------------+--------------------------+-----------+----------+---------------------------------------------
 id                | bigint                   |           | not null | nextval('org_invitations_id_seq'::regclass)
 org_id            | integer                  |           | not null | 
 sender_user_id    | integer                  |           | not null | 
 recipient_user_id | integer                  |           | not null | 
 created_at        | timestamp with time zone |           | not null | now()
 notified_at       | timestamp with time zone |           |          | 
 responded_at      | timestamp with time zone |           |          | 
 response_type     | boolean                  |           |          | 
 revoked_at        | timestamp with time zone |           |          | 
 deleted_at        | timestamp with time zone |           |          | 
Indexes:
    "org_invitations_pkey" PRIMARY KEY, btree (id)
    "org_invitations_singleflight" UNIQUE, btree (org_id, recipient_user_id) WHERE responded_at IS NULL AND revoked_at IS NULL AND deleted_at IS NULL
    "org_invitations_org_id" btree (org_id) WHERE deleted_at IS NULL
    "org_invitations_recipient_user_id" btree (recipient_user_id) WHERE deleted_at IS NULL
Check constraints:
    "check_atomic_response" CHECK ((responded_at IS NULL) = (response_type IS NULL))
    "check_single_use" CHECK (responded_at IS NULL AND response_type IS NULL OR revoked_at IS NULL)
Foreign-key constraints:
    "org_invitations_org_id_fkey" FOREIGN KEY (org_id) REFERENCES orgs(id)
    "org_invitations_recipient_user_id_fkey" FOREIGN KEY (recipient_user_id) REFERENCES users(id)
    "org_invitations_sender_user_id_fkey" FOREIGN KEY (sender_user_id) REFERENCES users(id)

```

# Table "public.org_members"
```
   Column   |           Type           | Collation | Nullable |                 Default                 
------------+--------------------------+-----------+----------+-----------------------------------------
 id         | integer                  |           | not null | nextval('org_members_id_seq'::regclass)
 org_id     | integer                  |           | not null | 
 created_at | timestamp with time zone |           | not null | now()
 updated_at | timestamp with time zone |           | not null | now()
 user_id    | integer                  |           | not null | 
Indexes:
    "org_members_pkey" PRIMARY KEY, btree (id)
    "org_members_org_id_user_id_key" UNIQUE CONSTRAINT, btree (org_id, user_id)
Foreign-key constraints:
    "org_members_references_orgs" FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE RESTRICT
    "org_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT

```

# Table "public.org_members_bkup_1514536731"
```
   Column    |           Type           | Collation | Nullable | Default 
-------------+--------------------------+-----------+----------+---------
 id          | integer                  |           |          | 
 org_id      | integer                  |           |          | 
 user_id_old | text                     |           |          | 
 created_at  | timestamp with time zone |           |          | 
 updated_at  | timestamp with time zone |           |          | 
 user_id     | integer                  |           |          | 

```

# Table "public.orgs"
```
      Column       |           Type           | Collation | Nullable |             Default              
-------------------+--------------------------+-----------+----------+----------------------------------
 id                | integer                  |           | not null | nextval('orgs_id_seq'::regclass)
 name              | citext                   |           | not null | 
 created_at        | timestamp with time zone |           | not null | now()
 updated_at        | timestamp with time zone |           | not null | now()
 display_name      | text                     |           |          | 
 slack_webhook_url | text                     |           |          | 
 deleted_at        | timestamp with time zone |           |          | 
Indexes:
    "orgs_pkey" PRIMARY KEY, btree (id)
    "orgs_name" UNIQUE, btree (name) WHERE deleted_at IS NULL
Check constraints:
    "orgs_display_name_max_length" CHECK (char_length(display_name) <= 255)
    "orgs_name_max_length" CHECK (char_length(name::text) <= 255)
    "orgs_name_valid_chars" CHECK (name ~ '^[a-zA-Z0-9](?:[a-zA-Z0-9]|[-.](?=[a-zA-Z0-9]))*-?$'::citext)
Referenced by:
    TABLE "batch_changes" CONSTRAINT "batch_changes_namespace_org_id_fkey" FOREIGN KEY (namespace_org_id) REFERENCES orgs(id) ON DELETE CASCADE DEFERRABLE
    TABLE "cm_monitors" CONSTRAINT "cm_monitors_org_id_fk" FOREIGN KEY (namespace_org_id) REFERENCES orgs(id) ON DELETE CASCADE
    TABLE "cm_recipients" CONSTRAINT "cm_recipients_org_id_fk" FOREIGN KEY (namespace_org_id) REFERENCES orgs(id) ON DELETE CASCADE
    TABLE "feature_flag_overrides" CONSTRAINT "feature_flag_overrides_namespace_org_id_fkey" FOREIGN KEY (namespace_org_id) REFERENCES orgs(id) ON DELETE CASCADE
    TABLE "names" CONSTRAINT "names_org_id_fkey" FOREIGN KEY (org_id) REFERENCES orgs(id) ON UPDATE CASCADE ON DELETE CASCADE
    TABLE "org_invitations" CONSTRAINT "org_invitations_org_id_fkey" FOREIGN KEY (org_id) REFERENCES orgs(id)
    TABLE "org_members" CONSTRAINT "org_members_references_orgs" FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE RESTRICT
    TABLE "registry_extensions" CONSTRAINT "registry_extensions_publisher_org_id_fkey" FOREIGN KEY (publisher_org_id) REFERENCES orgs(id)
    TABLE "saved_searches" CONSTRAINT "saved_searches_org_id_fkey" FOREIGN KEY (org_id) REFERENCES orgs(id)
    TABLE "search_contexts" CONSTRAINT "search_contexts_namespace_org_id_fk" FOREIGN KEY (namespace_org_id) REFERENCES orgs(id) ON DELETE CASCADE
    TABLE "settings" CONSTRAINT "settings_references_orgs" FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE RESTRICT

```

# Table "public.out_of_band_migrations"
```
          Column          |           Type           | Collation | Nullable |                      Default                       
--------------------------+--------------------------+-----------+----------+----------------------------------------------------
 id                       | integer                  |           | not null | nextval('out_of_band_migrations_id_seq'::regclass)
 team                     | text                     |           | not null | 
 component                | text                     |           | not null | 
 description              | text                     |           | not null | 
 progress                 | double precision         |           | not null | 0
 created                  | timestamp with time zone |           | not null | now()
 last_updated             | timestamp with time zone |           |          | 
 non_destructive          | boolean                  |           | not null | 
 apply_reverse            | boolean                  |           | not null | false
 is_enterprise            | boolean                  |           | not null | false
 introduced_version_major | integer                  |           | not null | 
 introduced_version_minor | integer                  |           | not null | 
 deprecated_version_major | integer                  |           |          | 
 deprecated_version_minor | integer                  |           |          | 
 metadata                 | jsonb                    |           | not null | '{}'::jsonb
Indexes:
    "out_of_band_migrations_pkey" PRIMARY KEY, btree (id)
Check constraints:
    "out_of_band_migrations_component_nonempty" CHECK (component <> ''::text)
    "out_of_band_migrations_description_nonempty" CHECK (description <> ''::text)
    "out_of_band_migrations_progress_range" CHECK (progress >= 0::double precision AND progress <= 1::double precision)
    "out_of_band_migrations_team_nonempty" CHECK (team <> ''::text)
Referenced by:
    TABLE "out_of_band_migrations_errors" CONSTRAINT "out_of_band_migrations_errors_migration_id_fkey" FOREIGN KEY (migration_id) REFERENCES out_of_band_migrations(id) ON DELETE CASCADE

```

Stores metadata and progress about an out-of-band migration routine.

**apply_reverse**: Whether this migration should run in the opposite direction (to support an upcoming downgrade).

**component**: The name of the component undergoing a migration.

**created**: The date and time the migration was inserted into the database (via an upgrade).

**deprecated_version_major**: The lowest Sourcegraph version (major component) that assumes the migration has completed.

**deprecated_version_minor**: The lowest Sourcegraph version (minor component) that assumes the migration has completed.

**description**: A brief description about the migration.

**id**: A globally unique primary key for this migration. The same key is used consistently across all Sourcegraph instances for the same migration.

**introduced_version_major**: The Sourcegraph version (major component) in which this migration was first introduced.

**introduced_version_minor**: The Sourcegraph version (minor component) in which this migration was first introduced.

**is_enterprise**: When true, these migrations are invisible to OSS mode.

**last_updated**: The date and time the migration was last updated.

**non_destructive**: Whether or not this migration alters data so it can no longer be read by the previous Sourcegraph instance.

**progress**: The percentage progress in the up direction (0=0%, 1=100%).

**team**: The name of the engineering team responsible for the migration.

# Table "public.out_of_band_migrations_errors"
```
    Column    |           Type           | Collation | Nullable |                          Default                          
--------------+--------------------------+-----------+----------+-----------------------------------------------------------
 id           | integer                  |           | not null | nextval('out_of_band_migrations_errors_id_seq'::regclass)
 migration_id | integer                  |           | not null | 
 message      | text                     |           | not null | 
 created      | timestamp with time zone |           | not null | now()
Indexes:
    "out_of_band_migrations_errors_pkey" PRIMARY KEY, btree (id)
Check constraints:
    "out_of_band_migrations_errors_message_nonempty" CHECK (message <> ''::text)
Foreign-key constraints:
    "out_of_band_migrations_errors_migration_id_fkey" FOREIGN KEY (migration_id) REFERENCES out_of_band_migrations(id) ON DELETE CASCADE

```

Stores errors that occurred while performing an out-of-band migration.

**created**: The date and time the error occurred.

**id**: A unique identifer.

**message**: The error message.

**migration_id**: The identifier of the migration.

# Table "public.phabricator_repos"
```
   Column   |           Type           | Collation | Nullable |                    Default                    
------------+--------------------------+-----------+----------+-----------------------------------------------
 id         | integer                  |           | not null | nextval('phabricator_repos_id_seq'::regclass)
 callsign   | citext                   |           | not null | 
 repo_name  | citext                   |           | not null | 
 created_at | timestamp with time zone |           | not null | now()
 updated_at | timestamp with time zone |           | not null | now()
 deleted_at | timestamp with time zone |           |          | 
 url        | text                     |           | not null | ''::text
Indexes:
    "phabricator_repos_pkey" PRIMARY KEY, btree (id)
    "phabricator_repos_repo_name_key" UNIQUE CONSTRAINT, btree (repo_name)

```

# Table "public.product_licenses"
```
         Column          |           Type           | Collation | Nullable | Default 
-------------------------+--------------------------+-----------+----------+---------
 id                      | uuid                     |           | not null | 
 product_subscription_id | uuid                     |           | not null | 
 license_key             | text                     |           | not null | 
 created_at              | timestamp with time zone |           | not null | now()
Indexes:
    "product_licenses_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "product_licenses_product_subscription_id_fkey" FOREIGN KEY (product_subscription_id) REFERENCES product_subscriptions(id)

```

# Table "public.product_subscriptions"
```
         Column          |           Type           | Collation | Nullable | Default 
-------------------------+--------------------------+-----------+----------+---------
 id                      | uuid                     |           | not null | 
 user_id                 | integer                  |           | not null | 
 billing_subscription_id | text                     |           |          | 
 created_at              | timestamp with time zone |           | not null | now()
 updated_at              | timestamp with time zone |           | not null | now()
 archived_at             | timestamp with time zone |           |          | 
Indexes:
    "product_subscriptions_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "product_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)
Referenced by:
    TABLE "product_licenses" CONSTRAINT "product_licenses_product_subscription_id_fkey" FOREIGN KEY (product_subscription_id) REFERENCES product_subscriptions(id)

```

# Table "public.query_runner_state"
```
      Column      |           Type           | Collation | Nullable | Default 
------------------+--------------------------+-----------+----------+---------
 query            | text                     |           |          | 
 last_executed    | timestamp with time zone |           |          | 
 latest_result    | timestamp with time zone |           |          | 
 exec_duration_ns | bigint                   |           |          | 

```

# Table "public.registry_extension_releases"
```
        Column         |           Type           | Collation | Nullable |                         Default                         
-----------------------+--------------------------+-----------+----------+---------------------------------------------------------
 id                    | bigint                   |           | not null | nextval('registry_extension_releases_id_seq'::regclass)
 registry_extension_id | integer                  |           | not null | 
 creator_user_id       | integer                  |           | not null | 
 release_version       | citext                   |           |          | 
 release_tag           | citext                   |           | not null | 
 manifest              | jsonb                    |           | not null | 
 bundle                | text                     |           |          | 
 created_at            | timestamp with time zone |           | not null | now()
 deleted_at            | timestamp with time zone |           |          | 
 source_map            | text                     |           |          | 
Indexes:
    "registry_extension_releases_pkey" PRIMARY KEY, btree (id)
    "registry_extension_releases_version" UNIQUE, btree (registry_extension_id, release_version) WHERE release_version IS NOT NULL
    "registry_extension_releases_registry_extension_id" btree (registry_extension_id, release_tag, created_at DESC) WHERE deleted_at IS NULL
Foreign-key constraints:
    "registry_extension_releases_creator_user_id_fkey" FOREIGN KEY (creator_user_id) REFERENCES users(id)
    "registry_extension_releases_registry_extension_id_fkey" FOREIGN KEY (registry_extension_id) REFERENCES registry_extensions(id) ON UPDATE CASCADE ON DELETE CASCADE

```

# Table "public.registry_extensions"
```
      Column       |           Type           | Collation | Nullable |                     Default                     
-------------------+--------------------------+-----------+----------+-------------------------------------------------
 id                | integer                  |           | not null | nextval('registry_extensions_id_seq'::regclass)
 uuid              | uuid                     |           | not null | 
 publisher_user_id | integer                  |           |          | 
 publisher_org_id  | integer                  |           |          | 
 name              | citext                   |           | not null | 
 manifest          | text                     |           |          | 
 created_at        | timestamp with time zone |           | not null | now()
 updated_at        | timestamp with time zone |           | not null | now()
 deleted_at        | timestamp with time zone |           |          | 
Indexes:
    "registry_extensions_pkey" PRIMARY KEY, btree (id)
    "registry_extensions_publisher_name" UNIQUE, btree (COALESCE(publisher_user_id, 0), COALESCE(publisher_org_id, 0), name) WHERE deleted_at IS NULL
    "registry_extensions_uuid" UNIQUE, btree (uuid)
Check constraints:
    "registry_extensions_name_length" CHECK (char_length(name::text) > 0 AND char_length(name::text) <= 128)
    "registry_extensions_name_valid_chars" CHECK (name ~ '^[a-zA-Z0-9](?:[a-zA-Z0-9]|[_.-](?=[a-zA-Z0-9]))*$'::citext)
    "registry_extensions_single_publisher" CHECK ((publisher_user_id IS NULL) <> (publisher_org_id IS NULL))
Foreign-key constraints:
    "registry_extensions_publisher_org_id_fkey" FOREIGN KEY (publisher_org_id) REFERENCES orgs(id)
    "registry_extensions_publisher_user_id_fkey" FOREIGN KEY (publisher_user_id) REFERENCES users(id)
Referenced by:
    TABLE "registry_extension_releases" CONSTRAINT "registry_extension_releases_registry_extension_id_fkey" FOREIGN KEY (registry_extension_id) REFERENCES registry_extensions(id) ON UPDATE CASCADE ON DELETE CASCADE

```

# Table "public.repo"
```
        Column         |           Type           | Collation | Nullable |             Default              
-----------------------+--------------------------+-----------+----------+----------------------------------
 id                    | integer                  |           | not null | nextval('repo_id_seq'::regclass)
 name                  | citext                   |           | not null | 
 description           | text                     |           |          | 
 fork                  | boolean                  |           |          | 
 created_at            | timestamp with time zone |           | not null | now()
 updated_at            | timestamp with time zone |           |          | 
 external_id           | text                     |           |          | 
 external_service_type | text                     |           |          | 
 external_service_id   | text                     |           |          | 
 archived              | boolean                  |           | not null | false
 uri                   | citext                   |           |          | 
 deleted_at            | timestamp with time zone |           |          | 
 metadata              | jsonb                    |           | not null | '{}'::jsonb
 private               | boolean                  |           | not null | false
 stars                 | integer                  |           |          | 
 blocked               | jsonb                    |           |          | 
Indexes:
    "repo_pkey" PRIMARY KEY, btree (id)
    "repo_external_unique_idx" UNIQUE, btree (external_service_type, external_service_id, external_id)
    "repo_name_unique" UNIQUE CONSTRAINT, btree (name) DEFERRABLE
    "repo_archived" btree (archived)
    "repo_blocked_idx" btree ((blocked IS NOT NULL))
    "repo_created_at" btree (created_at)
    "repo_fork" btree (fork)
    "repo_is_not_blocked_idx" btree ((blocked IS NULL))
    "repo_metadata_gin_idx" gin (metadata)
    "repo_name_idx" btree (lower(name::text) COLLATE "C")
    "repo_name_trgm" gin (lower(name::text) gin_trgm_ops)
    "repo_private" btree (private)
    "repo_stars_idx" btree (stars DESC NULLS LAST)
    "repo_uri_idx" btree (uri)
Check constraints:
    "check_name_nonempty" CHECK (name <> ''::citext)
    "repo_metadata_check" CHECK (jsonb_typeof(metadata) = 'object'::text)
Referenced by:
    TABLE "batch_spec_workspaces" CONSTRAINT "batch_spec_workspaces_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) DEFERRABLE
    TABLE "changeset_specs" CONSTRAINT "changeset_specs_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) DEFERRABLE
    TABLE "changesets" CONSTRAINT "changesets_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE DEFERRABLE
    TABLE "discussion_threads_target_repo" CONSTRAINT "discussion_threads_target_repo_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE
    TABLE "external_service_repos" CONSTRAINT "external_service_repos_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE DEFERRABLE
    TABLE "gitserver_repos" CONSTRAINT "gitserver_repos_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE
    TABLE "lsif_index_configuration" CONSTRAINT "lsif_index_configuration_repository_id_fkey" FOREIGN KEY (repository_id) REFERENCES repo(id) ON DELETE CASCADE
    TABLE "lsif_retention_configuration" CONSTRAINT "lsif_retention_configuration_repository_id_fkey" FOREIGN KEY (repository_id) REFERENCES repo(id) ON DELETE CASCADE
    TABLE "search_context_repos" CONSTRAINT "search_context_repos_repo_id_fk" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE
    TABLE "user_public_repos" CONSTRAINT "user_public_repos_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE
Triggers:
    trig_delete_repo_ref_on_external_service_repos AFTER UPDATE OF deleted_at ON repo FOR EACH ROW EXECUTE FUNCTION delete_repo_ref_on_external_service_repos()

```

# Table "public.repo_pending_permissions"
```
    Column     |           Type           | Collation | Nullable |     Default     
---------------+--------------------------+-----------+----------+-----------------
 repo_id       | integer                  |           | not null | 
 permission    | text                     |           | not null | 
 user_ids      | bytea                    |           | not null | '\x'::bytea
 updated_at    | timestamp with time zone |           | not null | 
 user_ids_ints | integer[]                |           | not null | '{}'::integer[]
Indexes:
    "repo_pending_permissions_perm_unique" UNIQUE CONSTRAINT, btree (repo_id, permission)

```

# Table "public.repo_permissions"
```
    Column     |           Type           | Collation | Nullable |     Default     
---------------+--------------------------+-----------+----------+-----------------
 repo_id       | integer                  |           | not null | 
 permission    | text                     |           | not null | 
 user_ids      | bytea                    |           | not null | '\x'::bytea
 updated_at    | timestamp with time zone |           | not null | 
 synced_at     | timestamp with time zone |           |          | 
 user_ids_ints | integer[]                |           | not null | '{}'::integer[]
Indexes:
    "repo_permissions_perm_unique" UNIQUE CONSTRAINT, btree (repo_id, permission)

```

# Table "public.saved_searches"
```
      Column       |           Type           | Collation | Nullable |                  Default                   
-------------------+--------------------------+-----------+----------+--------------------------------------------
 id                | integer                  |           | not null | nextval('saved_searches_id_seq'::regclass)
 description       | text                     |           | not null | 
 query             | text                     |           | not null | 
 created_at        | timestamp with time zone |           | not null | now()
 updated_at        | timestamp with time zone |           | not null | now()
 notify_owner      | boolean                  |           | not null | 
 notify_slack      | boolean                  |           | not null | 
 user_id           | integer                  |           |          | 
 org_id            | integer                  |           |          | 
 slack_webhook_url | text                     |           |          | 
Indexes:
    "saved_searches_pkey" PRIMARY KEY, btree (id)
Check constraints:
    "user_or_org_id_not_null" CHECK (user_id IS NOT NULL AND org_id IS NULL OR org_id IS NOT NULL AND user_id IS NULL)
Foreign-key constraints:
    "saved_searches_org_id_fkey" FOREIGN KEY (org_id) REFERENCES orgs(id)
    "saved_searches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)

```

# Table "public.schema_migrations"
```
 Column  |  Type   | Collation | Nullable | Default 
---------+---------+-----------+----------+---------
 version | bigint  |           | not null | 
 dirty   | boolean |           | not null | 
Indexes:
    "schema_migrations_pkey" PRIMARY KEY, btree (version)

```

# Table "public.search_context_repos"
```
      Column       |  Type   | Collation | Nullable | Default 
-------------------+---------+-----------+----------+---------
 search_context_id | bigint  |           | not null | 
 repo_id           | integer |           | not null | 
 revision          | text    |           | not null | 
Indexes:
    "search_context_repos_search_context_id_repo_id_revision_unique" UNIQUE CONSTRAINT, btree (search_context_id, repo_id, revision)
Foreign-key constraints:
    "search_context_repos_repo_id_fk" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE
    "search_context_repos_search_context_id_fk" FOREIGN KEY (search_context_id) REFERENCES search_contexts(id) ON DELETE CASCADE

```

# Table "public.search_contexts"
```
      Column       |           Type           | Collation | Nullable |                   Default                   
-------------------+--------------------------+-----------+----------+---------------------------------------------
 id                | bigint                   |           | not null | nextval('search_contexts_id_seq'::regclass)
 name              | citext                   |           | not null | 
 description       | text                     |           | not null | 
 public            | boolean                  |           | not null | 
 namespace_user_id | integer                  |           |          | 
 namespace_org_id  | integer                  |           |          | 
 created_at        | timestamp with time zone |           | not null | now()
 updated_at        | timestamp with time zone |           | not null | now()
 deleted_at        | timestamp with time zone |           |          | 
Indexes:
    "search_contexts_pkey" PRIMARY KEY, btree (id)
    "search_contexts_name_namespace_org_id_unique" UNIQUE, btree (name, namespace_org_id) WHERE namespace_org_id IS NOT NULL
    "search_contexts_name_namespace_user_id_unique" UNIQUE, btree (name, namespace_user_id) WHERE namespace_user_id IS NOT NULL
    "search_contexts_name_without_namespace_unique" UNIQUE, btree (name) WHERE namespace_user_id IS NULL AND namespace_org_id IS NULL
Check constraints:
    "search_contexts_has_one_or_no_namespace" CHECK (namespace_user_id IS NULL OR namespace_org_id IS NULL)
Foreign-key constraints:
    "search_contexts_namespace_org_id_fk" FOREIGN KEY (namespace_org_id) REFERENCES orgs(id) ON DELETE CASCADE
    "search_contexts_namespace_user_id_fk" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE
Referenced by:
    TABLE "search_context_repos" CONSTRAINT "search_context_repos_search_context_id_fk" FOREIGN KEY (search_context_id) REFERENCES search_contexts(id) ON DELETE CASCADE

```

# Table "public.security_event_logs"
```
      Column       |           Type           | Collation | Nullable |                     Default                     
-------------------+--------------------------+-----------+----------+-------------------------------------------------
 id                | bigint                   |           | not null | nextval('security_event_logs_id_seq'::regclass)
 name              | text                     |           | not null | 
 url               | text                     |           | not null | 
 user_id           | integer                  |           | not null | 
 anonymous_user_id | text                     |           | not null | 
 source            | text                     |           | not null | 
 argument          | jsonb                    |           | not null | 
 version           | text                     |           | not null | 
 timestamp         | timestamp with time zone |           | not null | 
Indexes:
    "security_event_logs_pkey" PRIMARY KEY, btree (id)
    "security_event_logs_anonymous_user_id" btree (anonymous_user_id)
    "security_event_logs_name" btree (name)
    "security_event_logs_source" btree (source)
    "security_event_logs_timestamp" btree ("timestamp")
    "security_event_logs_timestamp_at_utc" btree (date(timezone('UTC'::text, "timestamp")))
    "security_event_logs_user_id" btree (user_id)
Check constraints:
    "security_event_logs_check_has_user" CHECK (user_id = 0 AND anonymous_user_id <> ''::text OR user_id <> 0 AND anonymous_user_id = ''::text OR user_id <> 0 AND anonymous_user_id <> ''::text)
    "security_event_logs_check_name_not_empty" CHECK (name <> ''::text)
    "security_event_logs_check_source_not_empty" CHECK (source <> ''::text)
    "security_event_logs_check_version_not_empty" CHECK (version <> ''::text)

```

Contains security-relevant events with a long time horizon for storage.

**anonymous_user_id**: The UUID of the actor associated with the event.

**argument**: An arbitrary JSON blob containing event data.

**name**: The event name as a CAPITALIZED_SNAKE_CASE string.

**source**: The site section (WEB, BACKEND, etc.) that generated the event.

**url**: The URL within the Sourcegraph app which generated the event.

**user_id**: The ID of the actor associated with the event.

**version**: The version of Sourcegraph which generated the event.

# Table "public.settings"
```
     Column     |           Type           | Collation | Nullable |               Default                
----------------+--------------------------+-----------+----------+--------------------------------------
 id             | integer                  |           | not null | nextval('settings_id_seq'::regclass)
 org_id         | integer                  |           |          | 
 contents       | text                     |           |          | 
 created_at     | timestamp with time zone |           | not null | now()
 user_id        | integer                  |           |          | 
 author_user_id | integer                  |           |          | 
Indexes:
    "settings_pkey" PRIMARY KEY, btree (id)
    "settings_org_id_idx" btree (org_id)
    "settings_user_id_idx" btree (user_id)
Foreign-key constraints:
    "settings_author_user_id_fkey" FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE RESTRICT
    "settings_references_orgs" FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE RESTRICT
    "settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT

```

# Table "public.settings_bkup_1514702776"
```
       Column       |           Type           | Collation | Nullable | Default 
--------------------+--------------------------+-----------+----------+---------
 id                 | integer                  |           |          | 
 org_id             | integer                  |           |          | 
 author_user_id_old | text                     |           |          | 
 contents           | text                     |           |          | 
 created_at         | timestamp with time zone |           |          | 
 user_id            | integer                  |           |          | 
 author_user_id     | integer                  |           |          | 

```

# Table "public.survey_responses"
```
   Column   |           Type           | Collation | Nullable |                   Default                    
------------+--------------------------+-----------+----------+----------------------------------------------
 id         | bigint                   |           | not null | nextval('survey_responses_id_seq'::regclass)
 user_id    | integer                  |           |          | 
 email      | text                     |           |          | 
 score      | integer                  |           | not null | 
 reason     | text                     |           |          | 
 better     | text                     |           |          | 
 created_at | timestamp with time zone |           | not null | now()
Indexes:
    "survey_responses_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "survey_responses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)

```

# Table "public.temporary_settings"
```
   Column   |           Type           | Collation | Nullable |                    Default                     
------------+--------------------------+-----------+----------+------------------------------------------------
 id         | integer                  |           | not null | nextval('temporary_settings_id_seq'::regclass)
 user_id    | integer                  |           | not null | 
 contents   | jsonb                    |           |          | 
 created_at | timestamp with time zone |           | not null | now()
 updated_at | timestamp with time zone |           | not null | now()
Indexes:
    "temporary_settings_pkey" PRIMARY KEY, btree (id)
    "temporary_settings_user_id_key" UNIQUE CONSTRAINT, btree (user_id)
Foreign-key constraints:
    "temporary_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

```

Stores per-user temporary settings used in the UI, for example, which modals have been dimissed or what theme is preferred.

**contents**: JSON-encoded temporary settings.

**user_id**: The ID of the user the settings will be saved for.

# Table "public.user_credentials"
```
        Column         |           Type           | Collation | Nullable |                   Default                    
-----------------------+--------------------------+-----------+----------+----------------------------------------------
 id                    | bigint                   |           | not null | nextval('user_credentials_id_seq'::regclass)
 domain                | text                     |           | not null | 
 user_id               | integer                  |           | not null | 
 external_service_type | text                     |           | not null | 
 external_service_id   | text                     |           | not null | 
 created_at            | timestamp with time zone |           | not null | now()
 updated_at            | timestamp with time zone |           | not null | now()
 credential            | bytea                    |           | not null | 
 ssh_migration_applied | boolean                  |           | not null | false
 encryption_key_id     | text                     |           | not null | ''::text
Indexes:
    "user_credentials_pkey" PRIMARY KEY, btree (id)
    "user_credentials_domain_user_id_external_service_type_exter_key" UNIQUE CONSTRAINT, btree (domain, user_id, external_service_type, external_service_id)
    "user_credentials_credential_idx" btree ((encryption_key_id = ANY (ARRAY[''::text, 'previously-migrated'::text])))
Foreign-key constraints:
    "user_credentials_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE

```

# Table "public.user_emails"
```
          Column           |           Type           | Collation | Nullable | Default 
---------------------------+--------------------------+-----------+----------+---------
 user_id                   | integer                  |           | not null | 
 email                     | citext                   |           | not null | 
 created_at                | timestamp with time zone |           | not null | now()
 verification_code         | text                     |           |          | 
 verified_at               | timestamp with time zone |           |          | 
 last_verification_sent_at | timestamp with time zone |           |          | 
 is_primary                | boolean                  |           | not null | false
Indexes:
    "user_emails_no_duplicates_per_user" UNIQUE CONSTRAINT, btree (user_id, email)
    "user_emails_user_id_is_primary_idx" UNIQUE, btree (user_id, is_primary) WHERE is_primary = true
    "user_emails_unique_verified_email" EXCLUDE USING btree (email WITH =) WHERE (verified_at IS NOT NULL)
Foreign-key constraints:
    "user_emails_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)

```

# Table "public.user_external_accounts"
```
      Column       |           Type           | Collation | Nullable |                      Default                       
-------------------+--------------------------+-----------+----------+----------------------------------------------------
 id                | integer                  |           | not null | nextval('user_external_accounts_id_seq'::regclass)
 user_id           | integer                  |           | not null | 
 service_type      | text                     |           | not null | 
 service_id        | text                     |           | not null | 
 account_id        | text                     |           | not null | 
 auth_data         | text                     |           |          | 
 account_data      | text                     |           |          | 
 created_at        | timestamp with time zone |           | not null | now()
 updated_at        | timestamp with time zone |           | not null | now()
 deleted_at        | timestamp with time zone |           |          | 
 client_id         | text                     |           | not null | 
 expired_at        | timestamp with time zone |           |          | 
 last_valid_at     | timestamp with time zone |           |          | 
 encryption_key_id | text                     |           | not null | ''::text
Indexes:
    "user_external_accounts_pkey" PRIMARY KEY, btree (id)
    "user_external_accounts_account" UNIQUE, btree (service_type, service_id, client_id, account_id) WHERE deleted_at IS NULL
    "user_external_accounts_user_id" btree (user_id) WHERE deleted_at IS NULL
Foreign-key constraints:
    "user_external_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)

```

# Table "public.user_pending_permissions"
```
     Column      |           Type           | Collation | Nullable |                       Default                        
-----------------+--------------------------+-----------+----------+------------------------------------------------------
 id              | integer                  |           | not null | nextval('user_pending_permissions_id_seq'::regclass)
 bind_id         | text                     |           | not null | 
 permission      | text                     |           | not null | 
 object_type     | text                     |           | not null | 
 object_ids      | bytea                    |           | not null | '\x'::bytea
 updated_at      | timestamp with time zone |           | not null | 
 service_type    | text                     |           | not null | 
 service_id      | text                     |           | not null | 
 object_ids_ints | integer[]                |           | not null | '{}'::integer[]
Indexes:
    "user_pending_permissions_service_perm_object_unique" UNIQUE CONSTRAINT, btree (service_type, service_id, permission, object_type, bind_id)

```

# Table "public.user_permissions"
```
     Column      |           Type           | Collation | Nullable |     Default     
-----------------+--------------------------+-----------+----------+-----------------
 user_id         | integer                  |           | not null | 
 permission      | text                     |           | not null | 
 object_type     | text                     |           | not null | 
 object_ids      | bytea                    |           | not null | '\x'::bytea
 updated_at      | timestamp with time zone |           | not null | 
 synced_at       | timestamp with time zone |           |          | 
 object_ids_ints | integer[]                |           | not null | '{}'::integer[]
Indexes:
    "user_permissions_perm_object_unique" UNIQUE CONSTRAINT, btree (user_id, permission, object_type)

```

# Table "public.user_public_repos"
```
  Column  |  Type   | Collation | Nullable | Default 
----------+---------+-----------+----------+---------
 user_id  | integer |           | not null | 
 repo_uri | text    |           | not null | 
 repo_id  | integer |           | not null | 
Indexes:
    "user_public_repos_user_id_repo_id_key" UNIQUE CONSTRAINT, btree (user_id, repo_id)
Foreign-key constraints:
    "user_public_repos_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repo(id) ON DELETE CASCADE
    "user_public_repos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

```

# Table "public.users"
```
         Column          |           Type           | Collation | Nullable |              Default              
-------------------------+--------------------------+-----------+----------+-----------------------------------
 id                      | integer                  |           | not null | nextval('users_id_seq'::regclass)
 username                | citext                   |           | not null | 
 display_name            | text                     |           |          | 
 avatar_url              | text                     |           |          | 
 created_at              | timestamp with time zone |           | not null | now()
 updated_at              | timestamp with time zone |           | not null | now()
 deleted_at              | timestamp with time zone |           |          | 
 invite_quota            | integer                  |           | not null | 15
 passwd                  | text                     |           |          | 
 passwd_reset_code       | text                     |           |          | 
 passwd_reset_time       | timestamp with time zone |           |          | 
 site_admin              | boolean                  |           | not null | false
 page_views              | integer                  |           | not null | 0
 search_queries          | integer                  |           | not null | 0
 tags                    | text[]                   |           |          | '{}'::text[]
 billing_customer_id     | text                     |           |          | 
 invalidated_sessions_at | timestamp with time zone |           | not null | now()
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_billing_customer_id" UNIQUE, btree (billing_customer_id) WHERE deleted_at IS NULL
    "users_username" UNIQUE, btree (username) WHERE deleted_at IS NULL
    "users_created_at_idx" btree (created_at)
Check constraints:
    "users_display_name_max_length" CHECK (char_length(display_name) <= 255)
    "users_username_max_length" CHECK (char_length(username::text) <= 255)
    "users_username_valid_chars" CHECK (username ~ '^[a-zA-Z0-9](?:[a-zA-Z0-9]|[-.](?=[a-zA-Z0-9]))*-?$'::citext)
Referenced by:
    TABLE "access_tokens" CONSTRAINT "access_tokens_creator_user_id_fkey" FOREIGN KEY (creator_user_id) REFERENCES users(id)
    TABLE "access_tokens" CONSTRAINT "access_tokens_subject_user_id_fkey" FOREIGN KEY (subject_user_id) REFERENCES users(id)
    TABLE "batch_changes" CONSTRAINT "batch_changes_initial_applier_id_fkey" FOREIGN KEY (initial_applier_id) REFERENCES users(id) ON DELETE SET NULL DEFERRABLE
    TABLE "batch_changes" CONSTRAINT "batch_changes_last_applier_id_fkey" FOREIGN KEY (last_applier_id) REFERENCES users(id) ON DELETE SET NULL DEFERRABLE
    TABLE "batch_changes" CONSTRAINT "batch_changes_namespace_user_id_fkey" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE
    TABLE "batch_specs" CONSTRAINT "batch_specs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL DEFERRABLE
    TABLE "changeset_jobs" CONSTRAINT "changeset_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE
    TABLE "changeset_specs" CONSTRAINT "changeset_specs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL DEFERRABLE
    TABLE "cm_emails" CONSTRAINT "cm_emails_changed_by_fk" FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
    TABLE "cm_emails" CONSTRAINT "cm_emails_created_by_fk" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    TABLE "cm_monitors" CONSTRAINT "cm_monitors_changed_by_fk" FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
    TABLE "cm_monitors" CONSTRAINT "cm_monitors_created_by_fk" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    TABLE "cm_monitors" CONSTRAINT "cm_monitors_user_id_fk" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "cm_recipients" CONSTRAINT "cm_recipients_user_id_fk" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "cm_queries" CONSTRAINT "cm_triggers_changed_by_fk" FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
    TABLE "cm_queries" CONSTRAINT "cm_triggers_created_by_fk" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    TABLE "discussion_comments" CONSTRAINT "discussion_comments_author_user_id_fkey" FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE RESTRICT
    TABLE "discussion_mail_reply_tokens" CONSTRAINT "discussion_mail_reply_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    TABLE "discussion_threads" CONSTRAINT "discussion_threads_author_user_id_fkey" FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE RESTRICT
    TABLE "external_service_repos" CONSTRAINT "external_service_repos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE
    TABLE "external_services" CONSTRAINT "external_services_namepspace_user_id_fkey" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE
    TABLE "feature_flag_overrides" CONSTRAINT "feature_flag_overrides_namespace_user_id_fkey" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "names" CONSTRAINT "names_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
    TABLE "org_invitations" CONSTRAINT "org_invitations_recipient_user_id_fkey" FOREIGN KEY (recipient_user_id) REFERENCES users(id)
    TABLE "org_invitations" CONSTRAINT "org_invitations_sender_user_id_fkey" FOREIGN KEY (sender_user_id) REFERENCES users(id)
    TABLE "org_members" CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    TABLE "product_subscriptions" CONSTRAINT "product_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)
    TABLE "registry_extension_releases" CONSTRAINT "registry_extension_releases_creator_user_id_fkey" FOREIGN KEY (creator_user_id) REFERENCES users(id)
    TABLE "registry_extensions" CONSTRAINT "registry_extensions_publisher_user_id_fkey" FOREIGN KEY (publisher_user_id) REFERENCES users(id)
    TABLE "saved_searches" CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)
    TABLE "search_contexts" CONSTRAINT "search_contexts_namespace_user_id_fk" FOREIGN KEY (namespace_user_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "settings" CONSTRAINT "settings_author_user_id_fkey" FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE RESTRICT
    TABLE "settings" CONSTRAINT "settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    TABLE "survey_responses" CONSTRAINT "survey_responses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)
    TABLE "temporary_settings" CONSTRAINT "temporary_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    TABLE "user_credentials" CONSTRAINT "user_credentials_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE
    TABLE "user_emails" CONSTRAINT "user_emails_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)
    TABLE "user_external_accounts" CONSTRAINT "user_external_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)
    TABLE "user_public_repos" CONSTRAINT "user_public_repos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
Triggers:
    trig_invalidate_session_on_password_change BEFORE UPDATE OF passwd ON users FOR EACH ROW EXECUTE FUNCTION invalidate_session_for_userid_on_password_change()
    trig_soft_delete_user_reference_on_external_service AFTER UPDATE OF deleted_at ON users FOR EACH ROW EXECUTE FUNCTION soft_delete_user_reference_on_external_service()

```

# Table "public.versions"
```
    Column     |           Type           | Collation | Nullable | Default 
---------------+--------------------------+-----------+----------+---------
 service       | text                     |           | not null | 
 version       | text                     |           | not null | 
 updated_at    | timestamp with time zone |           | not null | now()
 first_version | text                     |           | not null | 
Indexes:
    "versions_pkey" PRIMARY KEY, btree (service)
Triggers:
    versions_insert BEFORE INSERT ON versions FOR EACH ROW EXECUTE FUNCTION versions_insert_row_trigger()

```

# View "public.branch_changeset_specs_and_changesets"
```
        Column         |  Type   | Collation | Nullable | Default 
-----------------------+---------+-----------+----------+---------
 changeset_spec_id     | bigint  |           |          | 
 changeset_id          | bigint  |           |          | 
 repo_id               | integer |           |          | 
 batch_spec_id         | bigint  |           |          | 
 owner_batch_change_id | bigint  |           |          | 
 repo_name             | citext  |           |          | 
 changeset_name        | text    |           |          | 
 external_state        | text    |           |          | 
 publication_state     | text    |           |          | 
 reconciler_state      | text    |           |          | 

```

## View query:

```sql
 SELECT changeset_specs.id AS changeset_spec_id,
    COALESCE(changesets.id, (0)::bigint) AS changeset_id,
    changeset_specs.repo_id,
    changeset_specs.batch_spec_id,
    changesets.owned_by_batch_change_id AS owner_batch_change_id,
    repo.name AS repo_name,
    changeset_specs.title AS changeset_name,
    changesets.external_state,
    changesets.publication_state,
    changesets.reconciler_state
   FROM ((changeset_specs
     LEFT JOIN changesets ON (((changesets.repo_id = changeset_specs.repo_id) AND (changesets.current_spec_id IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM changeset_specs changeset_specs_1
          WHERE ((changeset_specs_1.id = changesets.current_spec_id) AND (changeset_specs_1.head_ref = changeset_specs.head_ref)))))))
     JOIN repo ON ((changeset_specs.repo_id = repo.id)))
  WHERE ((changeset_specs.external_id IS NULL) AND (repo.deleted_at IS NULL));
```

# View "public.external_service_sync_jobs_with_next_sync_at"
```
       Column        |           Type           | Collation | Nullable | Default 
---------------------+--------------------------+-----------+----------+---------
 id                  | integer                  |           |          | 
 state               | text                     |           |          | 
 failure_message     | text                     |           |          | 
 started_at          | timestamp with time zone |           |          | 
 finished_at         | timestamp with time zone |           |          | 
 process_after       | timestamp with time zone |           |          | 
 num_resets          | integer                  |           |          | 
 num_failures        | integer                  |           |          | 
 execution_logs      | json[]                   |           |          | 
 external_service_id | bigint                   |           |          | 
 next_sync_at        | timestamp with time zone |           |          | 

```

## View query:

```sql
 SELECT j.id,
    j.state,
    j.failure_message,
    j.started_at,
    j.finished_at,
    j.process_after,
    j.num_resets,
    j.num_failures,
    j.execution_logs,
    j.external_service_id,
    e.next_sync_at
   FROM (external_services e
     JOIN external_service_sync_jobs j ON ((e.id = j.external_service_id)));
```

# View "public.lsif_dumps"
```
         Column         |           Type           | Collation | Nullable | Default 
------------------------+--------------------------+-----------+----------+---------
 id                     | integer                  |           |          | 
 commit                 | text                     |           |          | 
 root                   | text                     |           |          | 
 uploaded_at            | timestamp with time zone |           |          | 
 state                  | text                     |           |          | 
 failure_message        | text                     |           |          | 
 started_at             | timestamp with time zone |           |          | 
 finished_at            | timestamp with time zone |           |          | 
 repository_id          | integer                  |           |          | 
 indexer                | text                     |           |          | 
 num_parts              | integer                  |           |          | 
 uploaded_parts         | integer[]                |           |          | 
 process_after          | timestamp with time zone |           |          | 
 num_resets             | integer                  |           |          | 
 upload_size            | bigint                   |           |          | 
 num_failures           | integer                  |           |          | 
 associated_index_id    | bigint                   |           |          | 
 expired                | boolean                  |           |          | 
 last_retention_scan_at | timestamp with time zone |           |          | 
 processed_at           | timestamp with time zone |           |          | 

```

## View query:

```sql
 SELECT u.id,
    u.commit,
    u.root,
    u.uploaded_at,
    u.state,
    u.failure_message,
    u.started_at,
    u.finished_at,
    u.repository_id,
    u.indexer,
    u.num_parts,
    u.uploaded_parts,
    u.process_after,
    u.num_resets,
    u.upload_size,
    u.num_failures,
    u.associated_index_id,
    u.expired,
    u.last_retention_scan_at,
    u.finished_at AS processed_at
   FROM lsif_uploads u
  WHERE ((u.state = 'completed'::text) OR (u.state = 'deleting'::text));
```

# View "public.lsif_dumps_with_repository_name"
```
         Column         |           Type           | Collation | Nullable | Default 
------------------------+--------------------------+-----------+----------+---------
 id                     | integer                  |           |          | 
 commit                 | text                     |           |          | 
 root                   | text                     |           |          | 
 uploaded_at            | timestamp with time zone |           |          | 
 state                  | text                     |           |          | 
 failure_message        | text                     |           |          | 
 started_at             | timestamp with time zone |           |          | 
 finished_at            | timestamp with time zone |           |          | 
 repository_id          | integer                  |           |          | 
 indexer                | text                     |           |          | 
 num_parts              | integer                  |           |          | 
 uploaded_parts         | integer[]                |           |          | 
 process_after          | timestamp with time zone |           |          | 
 num_resets             | integer                  |           |          | 
 upload_size            | bigint                   |           |          | 
 num_failures           | integer                  |           |          | 
 associated_index_id    | bigint                   |           |          | 
 expired                | boolean                  |           |          | 
 last_retention_scan_at | timestamp with time zone |           |          | 
 processed_at           | timestamp with time zone |           |          | 
 repository_name        | citext                   |           |          | 

```

## View query:

```sql
 SELECT u.id,
    u.commit,
    u.root,
    u.uploaded_at,
    u.state,
    u.failure_message,
    u.started_at,
    u.finished_at,
    u.repository_id,
    u.indexer,
    u.num_parts,
    u.uploaded_parts,
    u.process_after,
    u.num_resets,
    u.upload_size,
    u.num_failures,
    u.associated_index_id,
    u.expired,
    u.last_retention_scan_at,
    u.processed_at,
    r.name AS repository_name
   FROM (lsif_dumps u
     JOIN repo r ON ((r.id = u.repository_id)))
  WHERE (r.deleted_at IS NULL);
```

# View "public.lsif_indexes_with_repository_name"
```
     Column      |           Type           | Collation | Nullable | Default 
-----------------+--------------------------+-----------+----------+---------
 id              | bigint                   |           |          | 
 commit          | text                     |           |          | 
 queued_at       | timestamp with time zone |           |          | 
 state           | text                     |           |          | 
 failure_message | text                     |           |          | 
 started_at      | timestamp with time zone |           |          | 
 finished_at     | timestamp with time zone |           |          | 
 repository_id   | integer                  |           |          | 
 process_after   | timestamp with time zone |           |          | 
 num_resets      | integer                  |           |          | 
 num_failures    | integer                  |           |          | 
 docker_steps    | jsonb[]                  |           |          | 
 root            | text                     |           |          | 
 indexer         | text                     |           |          | 
 indexer_args    | text[]                   |           |          | 
 outfile         | text                     |           |          | 
 log_contents    | text                     |           |          | 
 execution_logs  | json[]                   |           |          | 
 local_steps     | text[]                   |           |          | 
 repository_name | citext                   |           |          | 

```

## View query:

```sql
 SELECT u.id,
    u.commit,
    u.queued_at,
    u.state,
    u.failure_message,
    u.started_at,
    u.finished_at,
    u.repository_id,
    u.process_after,
    u.num_resets,
    u.num_failures,
    u.docker_steps,
    u.root,
    u.indexer,
    u.indexer_args,
    u.outfile,
    u.log_contents,
    u.execution_logs,
    u.local_steps,
    r.name AS repository_name
   FROM (lsif_indexes u
     JOIN repo r ON ((r.id = u.repository_id)))
  WHERE (r.deleted_at IS NULL);
```

# View "public.lsif_uploads_with_repository_name"
```
         Column         |           Type           | Collation | Nullable | Default 
------------------------+--------------------------+-----------+----------+---------
 id                     | integer                  |           |          | 
 commit                 | text                     |           |          | 
 root                   | text                     |           |          | 
 uploaded_at            | timestamp with time zone |           |          | 
 state                  | text                     |           |          | 
 failure_message        | text                     |           |          | 
 started_at             | timestamp with time zone |           |          | 
 finished_at            | timestamp with time zone |           |          | 
 repository_id          | integer                  |           |          | 
 indexer                | text                     |           |          | 
 num_parts              | integer                  |           |          | 
 uploaded_parts         | integer[]                |           |          | 
 process_after          | timestamp with time zone |           |          | 
 num_resets             | integer                  |           |          | 
 upload_size            | bigint                   |           |          | 
 num_failures           | integer                  |           |          | 
 associated_index_id    | bigint                   |           |          | 
 expired                | boolean                  |           |          | 
 last_retention_scan_at | timestamp with time zone |           |          | 
 repository_name        | citext                   |           |          | 

```

## View query:

```sql
 SELECT u.id,
    u.commit,
    u.root,
    u.uploaded_at,
    u.state,
    u.failure_message,
    u.started_at,
    u.finished_at,
    u.repository_id,
    u.indexer,
    u.num_parts,
    u.uploaded_parts,
    u.process_after,
    u.num_resets,
    u.upload_size,
    u.num_failures,
    u.associated_index_id,
    u.expired,
    u.last_retention_scan_at,
    r.name AS repository_name
   FROM (lsif_uploads u
     JOIN repo r ON ((r.id = u.repository_id)))
  WHERE (r.deleted_at IS NULL);
```

# View "public.reconciler_changesets"
```
          Column          |                     Type                     | Collation | Nullable | Default 
--------------------------+----------------------------------------------+-----------+----------+---------
 id                       | bigint                                       |           |          | 
 batch_change_ids         | jsonb                                        |           |          | 
 repo_id                  | integer                                      |           |          | 
 created_at               | timestamp with time zone                     |           |          | 
 updated_at               | timestamp with time zone                     |           |          | 
 metadata                 | jsonb                                        |           |          | 
 external_id              | text                                         |           |          | 
 external_service_type    | text                                         |           |          | 
 external_deleted_at      | timestamp with time zone                     |           |          | 
 external_branch          | text                                         |           |          | 
 external_updated_at      | timestamp with time zone                     |           |          | 
 external_state           | text                                         |           |          | 
 external_review_state    | text                                         |           |          | 
 external_check_state     | text                                         |           |          | 
 diff_stat_added          | integer                                      |           |          | 
 diff_stat_changed        | integer                                      |           |          | 
 diff_stat_deleted        | integer                                      |           |          | 
 sync_state               | jsonb                                        |           |          | 
 current_spec_id          | bigint                                       |           |          | 
 previous_spec_id         | bigint                                       |           |          | 
 publication_state        | text                                         |           |          | 
 owned_by_batch_change_id | bigint                                       |           |          | 
 reconciler_state         | text                                         |           |          | 
 failure_message          | text                                         |           |          | 
 started_at               | timestamp with time zone                     |           |          | 
 finished_at              | timestamp with time zone                     |           |          | 
 process_after            | timestamp with time zone                     |           |          | 
 num_resets               | integer                                      |           |          | 
 closing                  | boolean                                      |           |          | 
 num_failures             | integer                                      |           |          | 
 log_contents             | text                                         |           |          | 
 execution_logs           | json[]                                       |           |          | 
 syncer_error             | text                                         |           |          | 
 external_title           | text                                         |           |          | 
 worker_hostname          | text                                         |           |          | 
 ui_publication_state     | batch_changes_changeset_ui_publication_state |           |          | 

```

## View query:

```sql
 SELECT c.id,
    c.batch_change_ids,
    c.repo_id,
    c.created_at,
    c.updated_at,
    c.metadata,
    c.external_id,
    c.external_service_type,
    c.external_deleted_at,
    c.external_branch,
    c.external_updated_at,
    c.external_state,
    c.external_review_state,
    c.external_check_state,
    c.diff_stat_added,
    c.diff_stat_changed,
    c.diff_stat_deleted,
    c.sync_state,
    c.current_spec_id,
    c.previous_spec_id,
    c.publication_state,
    c.owned_by_batch_change_id,
    c.reconciler_state,
    c.failure_message,
    c.started_at,
    c.finished_at,
    c.process_after,
    c.num_resets,
    c.closing,
    c.num_failures,
    c.log_contents,
    c.execution_logs,
    c.syncer_error,
    c.external_title,
    c.worker_hostname,
    c.ui_publication_state
   FROM (changesets c
     JOIN repo r ON ((r.id = c.repo_id)))
  WHERE ((r.deleted_at IS NULL) AND (EXISTS ( SELECT 1
           FROM ((batch_changes
             LEFT JOIN users namespace_user ON ((batch_changes.namespace_user_id = namespace_user.id)))
             LEFT JOIN orgs namespace_org ON ((batch_changes.namespace_org_id = namespace_org.id)))
          WHERE ((c.batch_change_ids ? (batch_changes.id)::text) AND (namespace_user.deleted_at IS NULL) AND (namespace_org.deleted_at IS NULL)))));
```

# View "public.site_config"
```
   Column    |  Type   | Collation | Nullable | Default 
-------------+---------+-----------+----------+---------
 site_id     | uuid    |           |          | 
 initialized | boolean |           |          | 

```

## View query:

```sql
 SELECT global_state.site_id,
    global_state.initialized
   FROM global_state;
```

# View "public.tracking_changeset_specs_and_changesets"
```
      Column       |  Type   | Collation | Nullable | Default 
-------------------+---------+-----------+----------+---------
 changeset_spec_id | bigint  |           |          | 
 changeset_id      | bigint  |           |          | 
 repo_id           | integer |           |          | 
 batch_spec_id     | bigint  |           |          | 
 repo_name         | citext  |           |          | 
 changeset_name    | text    |           |          | 
 external_state    | text    |           |          | 
 publication_state | text    |           |          | 
 reconciler_state  | text    |           |          | 

```

## View query:

```sql
 SELECT changeset_specs.id AS changeset_spec_id,
    COALESCE(changesets.id, (0)::bigint) AS changeset_id,
    changeset_specs.repo_id,
    changeset_specs.batch_spec_id,
    repo.name AS repo_name,
    COALESCE((changesets.metadata ->> 'Title'::text), (changesets.metadata ->> 'title'::text)) AS changeset_name,
    changesets.external_state,
    changesets.publication_state,
    changesets.reconciler_state
   FROM ((changeset_specs
     LEFT JOIN changesets ON (((changesets.repo_id = changeset_specs.repo_id) AND (changesets.external_id = changeset_specs.external_id))))
     JOIN repo ON ((changeset_specs.repo_id = repo.id)))
  WHERE ((changeset_specs.external_id IS NOT NULL) AND (repo.deleted_at IS NULL));
```

# Type batch_changes_changeset_ui_publication_state

- UNPUBLISHED
- DRAFT
- PUBLISHED

# Type cm_email_priority

- NORMAL
- CRITICAL

# Type critical_or_site

- critical
- site

# Type feature_flag_type

- bool
- rollout

# Type lsif_index_state

- queued
- processing
- completed
- errored
- failed

# Type lsif_upload_state

- uploading
- queued
- processing
- completed
- errored
- deleted
- failed

# Type persistmode

- record
- snapshot

