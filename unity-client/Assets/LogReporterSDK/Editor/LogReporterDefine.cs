#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.Build;

namespace GameLogReporter.Editor
{
    /// <summary>
    /// 编辑期 API：开关 SDK 的编译宏 GAMELOG_REPORTER_ENABLED。
    /// 该宏控制整个 SDK 程序集是否参与编译，运行时无法改变，
    /// 故只能在编辑器下（构建脚本 / 工具）调用本类切换，切换后需重新编译。
    /// </summary>
    public static class LogReporterDefine
    {
        public const string Symbol = "GAMELOG_REPORTER_ENABLED";

        /// <summary>当前激活构建目标是否已定义该宏。</summary>
        public static bool IsEnabled => IsEnabledFor(Active);

        /// <summary>开启或关闭该宏（作用于当前激活的构建目标）。已是目标状态则不动。</summary>
        public static void SetEnabled(bool enabled) => SetEnabledFor(Active, enabled);

        /// <summary>查询指定构建目标是否定义了该宏。</summary>
        public static bool IsEnabledFor(NamedBuildTarget target)
        {
            var defines = PlayerSettings.GetScriptingDefineSymbols(target);
            foreach (var d in defines.Split(';'))
            {
                if (d.Trim() == Symbol) return true;
            }
            return false;
        }

        /// <summary>开关指定构建目标的该宏。</summary>
        public static void SetEnabledFor(NamedBuildTarget target, bool enabled)
        {
            if (IsEnabledFor(target) == enabled) return;

            var defines = PlayerSettings.GetScriptingDefineSymbols(target);
            if (enabled)
            {
                defines = string.IsNullOrEmpty(defines) ? Symbol : defines + ";" + Symbol;
            }
            else
            {
                var kept = new System.Collections.Generic.List<string>();
                foreach (var d in defines.Split(';'))
                {
                    var t = d.Trim();
                    if (t.Length > 0 && t != Symbol) kept.Add(t);
                }
                defines = string.Join(";", kept);
            }
            PlayerSettings.SetScriptingDefineSymbols(target, defines);
        }

        private static NamedBuildTarget Active =>
            NamedBuildTarget.FromBuildTargetGroup(
                BuildPipeline.GetBuildTargetGroup(EditorUserBuildSettings.activeBuildTarget));
    }
}
#endif
