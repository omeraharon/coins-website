function getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key) || null) || [];
}

function setToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getDataAsync(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            success: data => resolve(data),
            reject: err => reject(err)
        });
    });
}