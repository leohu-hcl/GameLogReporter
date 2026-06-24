using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace GameLogReporter
{
    /// <summary>
    /// SDK 统一的 JSON 序列化设置。
    /// 枚举发后端约定的字符串（[EnumMember] 值），日期发 ISO 8601，忽略 null。
    /// </summary>
    internal static class JsonSettings
    {
        public static readonly JsonSerializerSettings Default = new JsonSerializerSettings
        {
            Converters = { new StringEnumConverter() },
            DateFormatHandling = DateFormatHandling.IsoDateFormat,
            DateTimeZoneHandling = DateTimeZoneHandling.Utc,
            NullValueHandling = NullValueHandling.Ignore,
        };
    }
}
