// 모든 쪽에 채널톡 버튼을 띄운다. 버튼이 왼쪽에 뜰지 오른쪽에 뜰지는 여기가 아니라 채널톡 관리 화면의 설정이다.
// Mintlify 는 레포 안의 .js 파일을 모든 쪽에 자동으로 싣는다(.mintignore 에 있는 폴더는 제외).
// 플러그인 키는 공개 값이다 — https://yl706.channel.io 의 페이지 소스에 그대로 들어 있다.
(function () {
  var w = window;
  if (w.ChannelIO) return;
  var ch = function () {
    ch.c(arguments);
  };
  ch.q = [];
  ch.c = function (args) {
    ch.q.push(args);
  };
  w.ChannelIO = ch;
  function load() {
    if (w.ChannelIOInitialized) return;
    w.ChannelIOInitialized = true;
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
    var x = document.getElementsByTagName("script")[0];
    if (x.parentNode) x.parentNode.insertBefore(s, x);
  }
  if (document.readyState === "complete") load();
  else {
    w.addEventListener("DOMContentLoaded", load);
    w.addEventListener("load", load);
  }
})();

window.ChannelIO("boot", { pluginKey: "0e26a799-864f-41cb-94d4-8f51395e6839", language: "ko" });
