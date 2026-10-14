-- Gestión eclesial · esquema MySQL 8 (borrador)
-- Reglas que este esquema sostiene:
--  * Cada iglesia está aislada: casi todas las tablas llevan church_id.
--  * Los servicios se crean solos al agregar servidores al cronograma (roster_entries).
--  * LEADER ve y gestiona solo los ministerios de user_ministries.
--  * TECHNICIAN ve solo su ministerio y solo lectura del cronograma; confirma o rechaza sus turnos.
--  * Impersonar (SUPER_ADMIN) queda registrado en audit_log.

SET NAMES utf8mb4;
SET time_zone = '-05:00';

CREATE TABLE churches (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(20)  NOT NULL UNIQUE,          -- código que usa el login de iglesia (ej. IBP-0421)
  name        VARCHAR(150) NOT NULL,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE ministries (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  church_id   BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL,                 -- Sonido, Video, Alabanza, Recepción…
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_ministry_church_name (church_id, name),
  CONSTRAINT fk_ministries_church FOREIGN KEY (church_id) REFERENCES churches(id)
) ENGINE=InnoDB;

-- SUPER_ADMIN no pertenece a una iglesia: church_id puede ser NULL solo para ese rol.
CREATE TABLE users (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  church_id            BIGINT UNSIGNED NULL,
  role                 ENUM('SUPER_ADMIN','ADMIN','LEADER','TECHNICIAN') NOT NULL,
  full_name            VARCHAR(150) NOT NULL,
  email                VARCHAR(190) NOT NULL UNIQUE,
  phone                VARCHAR(30)  NULL,             -- dato sensible: solo SUPER_ADMIN y ADMIN
  address              VARCHAR(255) NULL,             -- dato sensible: solo SUPER_ADMIN y ADMIN
  password_hash        VARCHAR(255) NOT NULL,         -- argon2id o bcrypt, nunca texto plano
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at        TIMESTAMP NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_church FOREIGN KEY (church_id) REFERENCES churches(id),
  CONSTRAINT chk_superadmin_sin_iglesia CHECK ((role = 'SUPER_ADMIN') OR (church_id IS NOT NULL)),
  INDEX idx_users_church_role (church_id, role)
) ENGINE=InnoDB;

-- Un técnico o líder puede pertenecer a varios ministerios.
-- es_lider = TRUE indica que dirige ese ministerio (LEADER).
CREATE TABLE user_ministries (
  user_id      BIGINT UNSIGNED NOT NULL,
  ministry_id  BIGINT UNSIGNED NOT NULL,
  es_lider     BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, ministry_id),
  CONSTRAINT fk_um_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_um_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id),
  INDEX idx_um_ministry (ministry_id)
) ENGINE=InnoDB;

-- Tipo de servicio: plantilla recurrente (ej. Domingo 9:00 a. m.).
CREATE TABLE service_types (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  church_id    BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(100) NOT NULL,
  weekday      TINYINT UNSIGNED NOT NULL,             -- 1 = lunes … 7 = domingo
  start_time   TIME NOT NULL,
  duration_min SMALLINT UNSIGNED NOT NULL DEFAULT 120,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_st_church FOREIGN KEY (church_id) REFERENCES churches(id)
) ENGINE=InnoDB;

-- Servicios concretos. Se crean automáticamente cuando se asigna el primer servidor
-- a un tipo de servicio en una fecha. Por eso la unicidad evita duplicados.
CREATE TABLE services (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  church_id        BIGINT UNSIGNED NOT NULL,
  service_type_id  BIGINT UNSIGNED NOT NULL,
  starts_at        DATETIME NOT NULL,
  status           ENUM('draft','published','cancelled') NOT NULL DEFAULT 'published',
  source           ENUM('auto','manual') NOT NULL DEFAULT 'auto',
  created_by       BIGINT UNSIGNED NULL,               -- NULL cuando se crea automáticamente
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_service_slot (church_id, service_type_id, starts_at),
  CONSTRAINT fk_svc_church FOREIGN KEY (church_id) REFERENCES churches(id),
  CONSTRAINT fk_svc_type FOREIGN KEY (service_type_id) REFERENCES service_types(id),
  CONSTRAINT fk_svc_creator FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_svc_church_date (church_id, starts_at)
) ENGINE=InnoDB;

-- Cronograma: quién sirve en qué servicio y en qué ministerio.
-- Al insertar una fila aquí, la aplicación crea el services si no existe (misma transacción).
CREATE TABLE roster_entries (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  church_id    BIGINT UNSIGNED NOT NULL,              -- copiado para aislamiento y consultas rápidas
  service_id   BIGINT UNSIGNED NOT NULL,
  ministry_id  BIGINT UNSIGNED NOT NULL,
  user_id      BIGINT UNSIGNED NOT NULL,
  status       ENUM('asignado','confirmado','rechazado') NOT NULL DEFAULT 'asignado',
  responded_at TIMESTAMP NULL,
  assigned_by  BIGINT UNSIGNED NOT NULL,              -- ADMIN o LEADER que asignó
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roster (service_id, ministry_id, user_id),
  CONSTRAINT fk_roster_church FOREIGN KEY (church_id) REFERENCES churches(id),
  CONSTRAINT fk_roster_service FOREIGN KEY (service_id) REFERENCES services(id),
  CONSTRAINT fk_roster_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id),
  CONSTRAINT fk_roster_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_roster_assigner FOREIGN KEY (assigned_by) REFERENCES users(id),
  INDEX idx_roster_user (user_id, status),
  INDEX idx_roster_ministry (ministry_id, service_id)
) ENGINE=InnoDB;

-- Anuncios del panel.
CREATE TABLE announcements (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  church_id    BIGINT UNSIGNED NOT NULL,
  author_id    BIGINT UNSIGNED NOT NULL,
  priority     ENUM('alta','media','baja') NOT NULL DEFAULT 'media',
  category     VARCHAR(60) NOT NULL DEFAULT 'General',
  title        VARCHAR(200) NOT NULL,
  summary      VARCHAR(255) NOT NULL,
  body         TEXT NOT NULL,
  audience     ENUM('todos','roles','ministerio') NOT NULL DEFAULT 'todos',
  ministry_id  BIGINT UNSIGNED NULL,                  -- solo si audience = 'ministerio'
  status       ENUM('draft','scheduled','published','archived') NOT NULL DEFAULT 'published',
  publish_at   DATETIME NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ann_church FOREIGN KEY (church_id) REFERENCES churches(id),
  CONSTRAINT fk_ann_author FOREIGN KEY (author_id) REFERENCES users(id),
  CONSTRAINT fk_ann_ministry FOREIGN KEY (ministry_id) REFERENCES ministries(id),
  INDEX idx_ann_church_status (church_id, status, publish_at)
) ENGINE=InnoDB;

-- Roles a los que va dirigido un anuncio cuando audience = 'roles'.
CREATE TABLE announcement_roles (
  announcement_id BIGINT UNSIGNED NOT NULL,
  role            ENUM('SUPER_ADMIN','ADMIN','LEADER','TECHNICIAN') NOT NULL,
  PRIMARY KEY (announcement_id, role),
  CONSTRAINT fk_annr_ann FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Lecturas por usuario: marcar como leído.
CREATE TABLE announcement_reads (
  announcement_id BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  read_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (announcement_id, user_id),
  CONSTRAINT fk_annread_ann FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  CONSTRAINT fk_annread_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_annread_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE comments (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  body            VARCHAR(1000) NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cmt_ann FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  CONSTRAINT fk_cmt_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_cmt_ann (announcement_id, created_at)
) ENGINE=InnoDB;

-- Tokens para resetear contraseña. Se guarda solo el hash del token.
CREATE TABLE password_reset_tokens (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  CHAR(64) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  used_at     TIMESTAMP NULL,
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_prt_user (user_id)
) ENGINE=InnoDB;

-- Registro de acciones sensibles, incluido "Ver como otro usuario" (impersonación).
CREATE TABLE audit_log (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id               BIGINT UNSIGNED NOT NULL,
  impersonated_user_id   BIGINT UNSIGNED NULL,
  church_id              BIGINT UNSIGNED NULL,
  action                 VARCHAR(80) NOT NULL,        -- ej. 'impersonate.start', 'user.role_change', 'password.reset'
  entity                 VARCHAR(60) NULL,
  entity_id              BIGINT UNSIGNED NULL,
  ip                     VARCHAR(45) NULL,
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id),
  CONSTRAINT fk_audit_imp FOREIGN KEY (impersonated_user_id) REFERENCES users(id),
  INDEX idx_audit_actor (actor_id, created_at)
) ENGINE=InnoDB;
