async function httpGet(filePath) {
    let res = await fetch(filePath)
    return res.text();
}