use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Migration schema is embedded at compile time.
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: include_str!("../migrations/0001_initial_schema.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_customer_orders",
            sql: include_str!("../migrations/0002_customer_orders.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "link_transactions_to_orders",
            sql: include_str!("../migrations/0003_transactions_order.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_multi_content_to_ideas",
            sql: include_str!("../migrations/0004_idea_multi_content.sql"),
            kind: MigrationKind::Up,
        },
        Migration { version: 5, description: "add_title_to_ideas", sql: include_str!("../migrations/0005_idea_title.sql"), kind: MigrationKind::Up },
        Migration { version: 6, description: "add_reference_sort_order", sql: include_str!("../migrations/0006_reference_sort_order.sql"), kind: MigrationKind::Up },
        Migration { version: 7, description: "create_daily_tasks", sql: include_str!("../migrations/0007_daily_tasks.sql"), kind: MigrationKind::Up },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:rakit.db", migrations)
                .build(),
        )
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
