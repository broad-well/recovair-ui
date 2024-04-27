import path from "node:path";

export default {
    database: path.join(import.meta.dirname, "db", "testing.db")
}