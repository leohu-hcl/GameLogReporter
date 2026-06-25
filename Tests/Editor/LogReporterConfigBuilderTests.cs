using NUnit.Framework;
using UnityEditor;
using GameLogReporter;
using GameLogReporter.Editor;

namespace GameLogReporter.Editor.Tests
{
    /// <summary>
    /// LogReporterConfigBuilder 编辑期测试。
    /// 每个用例后清理生成的资源，避免污染工程。
    /// </summary>
    public class LogReporterConfigBuilderTests
    {
        private const string AssetPath = "Assets/Resources/LogReporterConfig.asset";

        [SetUp]
        [TearDown]
        public void CleanUp()
        {
            // 前后都清，确保用例间互不干扰
            if (AssetDatabase.LoadAssetAtPath<LogReporterConfig>(AssetPath) != null)
            {
                AssetDatabase.DeleteAsset(AssetPath);
            }
        }

        [Test]
        public void CreateOrUpdate_WhenAbsent_CreatesAssetWithValues()
        {
            var result = LogReporterConfigBuilder.CreateOrUpdate(c =>
            {
                c.apiBaseUrl = "https://staging.example.com/api";
                c.batchInterval = 3f;
            });

            Assert.IsNotNull(result);
            var loaded = AssetDatabase.LoadAssetAtPath<LogReporterConfig>(AssetPath);
            Assert.IsNotNull(loaded, "资源应被创建在固定 Resources 路径");
            Assert.AreEqual("https://staging.example.com/api", loaded.apiBaseUrl);
            Assert.AreEqual(3f, loaded.batchInterval);
        }

        [Test]
        public void CreateOrUpdate_WhenExists_UpdatesInPlaceAndKeepsUntouchedFields()
        {
            // 首次创建：设 url + 自定义 batchSize
            LogReporterConfigBuilder.CreateOrUpdate(c =>
            {
                c.apiBaseUrl = "https://first/api";
                c.batchSize = 99;
            });

            // 二次更新：只改 url，batchSize 不动
            LogReporterConfigBuilder.CreateOrUpdate(c =>
            {
                c.apiBaseUrl = "https://second/api";
            });

            var loaded = AssetDatabase.LoadAssetAtPath<LogReporterConfig>(AssetPath);
            Assert.AreEqual("https://second/api", loaded.apiBaseUrl, "url 应被更新");
            Assert.AreEqual(99, loaded.batchSize, "未触碰的字段应保留上次的值（原地更新而非重建）");
        }

        [Test]
        public void CreateOrUpdate_NullConfigure_Throws()
        {
            Assert.Throws<System.ArgumentNullException>(
                () => LogReporterConfigBuilder.CreateOrUpdate(null));
        }

        [Test]
        public void Delete_RemovesAsset_AndReturnsFalseWhenAbsent()
        {
            LogReporterConfigBuilder.CreateOrUpdate(c => c.apiBaseUrl = "https://x/api");
            Assert.IsTrue(LogReporterConfigBuilder.Delete(), "存在时删除应返回 true");
            Assert.IsNull(AssetDatabase.LoadAssetAtPath<LogReporterConfig>(AssetPath));

            Assert.IsFalse(LogReporterConfigBuilder.Delete(), "不存在时删除应返回 false");
        }
    }
}
