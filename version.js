function checkVersion() {
  try {
      window.fetch(window.location.origin + window.location.pathname + "version.json" + "?d=" + new Date().toLocaleString('default', { month: 'long', year: 'numeric', day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }))
      .then((response) => response.json())
      .then(
          (result) => {
              let currentVersion = result.version;
              let storedVersion = localStorage.getItem("version");
              if (!storedVersion || parseInt(storedVersion) != currentVersion) {
                  try { GoatEvent("Version: " + storedVersion + "=>" + currentVersion); } catch(e) {}
                  localStorage.setItem("version", currentVersion);
                  caches.keys().then(function(names) {
                      for (let name of names) {
                          caches.delete(name);
                      }
                  });                
                  window.location.reload();                  
              }            
          },
          (error) => {
          }
      );
  } catch(e) {
  }
}

checkVersion();