using NUnit.Framework;
using GameLogReporter;
using UnityEngine;

namespace GameLogReporter.Tests
{
    /// <summary>
    /// 占位冒烟测试 - 验证程序集引用与默认配置可用。
    /// </summary>
    public class SmokeTest
    {
        [Test]
        public void DefaultConfig_HasSaneDefaults()
        {
            var config = ScriptableObject.CreateInstance<LogReporterConfig>();

            Assert.IsNotNull(config);
            Assert.IsFalse(string.IsNullOrEmpty(config.apiBaseUrl), "apiBaseUrl 默认值不应为空");
            Assert.Greater(config.batchSize, 0, "batchSize 默认值应为正");
            Assert.Greater(config.batchInterval, 0f, "batchInterval 默认值应为正");

            Object.DestroyImmediate(config);
        }

        [Test]
        public void Clone_ProducesIndependentCopy()
        {
            var config = ScriptableObject.CreateInstance<LogReporterConfig>();
            config.apiBaseUrl = "http://original";

            var clone = config.Clone();
            clone.apiBaseUrl = "http://changed";

            Assert.AreEqual("http://original", config.apiBaseUrl, "克隆后修改不应影响原配置");

            Object.DestroyImmediate(config);
            Object.DestroyImmediate(clone);
        }
    }
}
