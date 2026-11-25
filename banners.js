// زر التثبيت في الهيدر (تعريفات الدوال بس) — classic script بيتحمّل قبل app.js؛ بتستخدم `$` من app.js وقت التشغيل بس، والمستمعين والاستدعاءات فضلت في app.js. (بانر التحديث وكل منطق التحديث في update.js.)
/* exported isAppInstalled, setInstalledFlag, refreshInstallButton */

const INSTALLED_FLAG_KEY = "nawyInstalled";

// جوه التطبيق المثبّت (أي وضع عرض غير تبويب المتصفح العادي، وآيفون بـ navigator.standalone).
function isAppInstalled() {
  const modes = ["standalone", "minimal-ui", "fullscreen", "window-controls-overlay"];
  return (
    modes.some(mode => window.matchMedia(`(display-mode: ${mode})`).matches) || window.navigator.standalone === true
  );
}

// علامة محلية بتفتكر إن التطبيق اتثبّت، عشان الزر ميرجعش يظهر لما تفتح الموقع في تبويب المتصفح بعد التثبيت.
// المتصفح بيبعت beforeinstallprompt بس لو التطبيق مش مثبّت، فاستقباله بيمسح العلامة (لو اتشال).
function setInstalledFlag(on) {
  try {
    if (on) localStorage.setItem(INSTALLED_FLAG_KEY, "1");
    else localStorage.removeItem(INSTALLED_FLAG_KEY);
  } catch (error) {
    console.warn("Install flag unavailable", error);
  }
}

function hasInstalledFlag() {
  try {
    return localStorage.getItem(INSTALLED_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

// الزر بيظهر في تبويب المتصفح بس لو التطبيق مش مثبّت، وبيختفي جوه التطبيق المثبّت وبعد التثبيت.
function refreshInstallButton() {
  $("#installBtn").hidden = isAppInstalled() || hasInstalledFlag();
}
