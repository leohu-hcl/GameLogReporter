# Changelog

本项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2026-06-22

### Added
- 改造为标准 UPM 包（`com.gamelogreporter.sdk`）。
- 自启动：`[RuntimeInitializeOnLoadMethod(BeforeSceneLoad)]` 自动创建 `LogReporter`，无需场景挂载。
- `LogReporterConfig` ScriptableObject 配置，支持 `Create > GameLogReporter > Config`。
- 代码配置 API `LogReporter.Configure(...)`，优先级高于 Resources 资源。
- Runtime / Editor / Tests 程序集分离（asmdef）。

### Changed
- 目录重构：源码从 `Scripts/` 移至 `Runtime/`。
- 配置由 prefab Inspector 字段改为 `LogReporterConfig`（Resources 资源或代码）。
