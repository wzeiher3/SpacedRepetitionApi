module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URL: process.env.DATABASE_URL
    || 'postgresql://dunder_mifflin@localhost/SR_Database',
  JWT_SECRET: process.env.JWT_SECRET || 'this-is-a-secret',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '3h',
}
