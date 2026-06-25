#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace GameLogReporter.Editor
{
    /// <summary>
    /// 编辑期工具：创建 / 更新 LogReporterConfig 资源。
    /// </summary>
    public static class LogReporterConfigBuilder
    {
        // 固定生成到工程 Resources 下，文件名与 ResolveConfig 约定一致
        private const string AssetDir = "Assets/Resources";
        private static string AssetPath => $"{AssetDir}/{LogReporterConfig.ResourceName}.asset";

        /// <summary>
        /// 创建或更新配置资源。已存在则在其基础上应用 configure，不存在则新建后应用。
        /// </summary>
        /// <param name="configure">对配置实例应用的修改（设置 apiBaseUrl 等）。</param>
        /// <returns>落盘后的配置资源。</returns>
        public static LogReporterConfig CreateOrUpdate(Action<LogReporterConfig> configure)
        {
            if (configure == null) throw new ArgumentNullException(nameof(configure));

            EnsureResourcesFolder();

            var config = AssetDatabase.LoadAssetAtPath<LogReporterConfig>(AssetPath);
            bool isNew = config == null;
            if (isNew)
            {
                config = ScriptableObject.CreateInstance<LogReporterConfig>();
            }

            configure(config);

            if (isNew)
            {
                AssetDatabase.CreateAsset(config, AssetPath);
            }
            else
            {
                EditorUtility.SetDirty(config);
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log($"[LogReporter] {(isNew ? "Created" : "Updated")} config at {AssetPath} (apiBaseUrl={config.apiBaseUrl})");
            return config;
        }

        /// <summary>
        /// 删除已生成的配置资源（若存在）。
        /// </summary>
        public static bool Delete()
        {
            if (AssetDatabase.LoadAssetAtPath<LogReporterConfig>(AssetPath) == null)
            {
                return false;
            }
            bool ok = AssetDatabase.DeleteAsset(AssetPath);
            AssetDatabase.Refresh();
            return ok;
        }

        private static void EnsureResourcesFolder()
        {
            if (!AssetDatabase.IsValidFolder(AssetDir))
            {
                AssetDatabase.CreateFolder("Assets", "Resources");
            }
        }
    }
}
#endif
