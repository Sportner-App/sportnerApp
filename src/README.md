# Source architecture

- `app/` remains the Expo Router entrypoint and should only contain thin route files.
- `pages/` holds route-level screens and page composition.
- `widgets/` holds reusable screen sections such as navigation shells and developer helpers.
- `features/` is reserved for user actions and business flows.
- `entities/` is reserved for domain models, state, and entity-specific UI.
- `shared/` holds cross-cutting UI, hooks, and configuration.