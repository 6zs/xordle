export function checkVersion() {
    window.fetch(window.location.origin + window.location.pathname + "version.json")
    .then((response) => response.json())
    .then(
        (result) => {
            let currentVersion = result.version;
            let storedVersion = localStorage.getItem("version");
            if (!storedVersion || parseInt(storedVersion) != currentVersion) {
                localStorage.setItem("version", currentVersion);
                window.location.reload();
            }            
        },
        (error) => {
        }
    );
}