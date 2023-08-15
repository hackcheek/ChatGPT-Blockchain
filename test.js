window.taskIndex = -1

function listener(taskRunner) {
    console.log("[test.js] in listener")
    console.log("taskIndex", window.taskIndex)
    setInterval(() => {
        if (window.taskIndex > -1) {
            const child = setInterval(async () => {
                window.resultsCount = await taskRunner.getAvailableTaskResultsCount(window.taskIndex);
                console.log(`[test.js] count=${window.resultsCount}`)
                if (window.resultsCount >= 2) {
                    clearInterval(child)
                }
            }, 1000)
        }
    }, 1000);
}

async function getContracts(
    tokenABI, tokenAddress, taskRunnerABI, taskRunnerAddress, signer
) {
    window.token = new ethers.Contract(
        tokenAddress, tokenABI, signer
    );
    window.taskRunner = new ethers.Contract(
        taskRunnerAddress, taskRunnerABI, signer
    );
    console.log(">>>>", window.taskRunner)
}

async function test() {
    const privateKeyResponse = await fetch(".env");
    const lazyPrivateKey = await privateKeyResponse.text();
    const privateKey = String(lazyPrivateKey)
        .replace('PRIVATE_KEY=', '')
        .trim();

    const anvil_rpc = "http://127.0.0.1:8545";
    const provider = new ethers.providers.JsonRpcProvider(anvil_rpc);
    const signer = new ethers.Wallet(privateKey, provider);

    const taskRunnerAddress = "0xDAE95F004b4B308921c8fdead101555eAB83916B";
    const taskRunnerABIResponse = await fetch("./data/TaskRunnerABI.json");
    const taskRunnerABI = await taskRunnerABIResponse.json()

    const taskRunner = new ethers.Contract(
        taskRunnerAddress, taskRunnerABI, signer
    );
    // // sleep 2 seconds
    // await new Promise(resolve => setTimeout(resolve, 2000));
    return listener(taskRunner)
}
// test()
