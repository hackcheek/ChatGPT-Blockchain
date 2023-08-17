window.taskIndex = -1
window.minResults = 2

function listener(taskRunner) {
    console.log("[test.js] in listener")
    console.log("taskIndex", window.taskIndex)
    taskRunner.getAvailableTaskResultsCount(7)
        .then((a) => console.log(">>>>>>>>>>>", a));
    setInterval(() => {
        if (window.taskIndex > -1) {
            const child = setInterval(async () => {
                window.resultsCount = await taskRunner.getAvailableTaskResultsCount(window.taskIndex);
                console.log(`[test.js] count=${window.resultsCount}`)
                if (window.resultsCount >= window.minResults) {
                    clearInterval(child)
                }
            }, 1000)
        }
    }, 1000);
}

async function test() {
    const privateKeyResponse = await fetch(".env");
    const lazyPrivateKey = await privateKeyResponse.text();
    const privateKey = String(lazyPrivateKey)
        .replace('PRIVATE_KEY=', '')
        .trim();

    const anvil = {
        rpc: "http://127.0.0.1:8545",
        taskRunnerAddress: "0xDAE95F004b4B308921c8fdead101555eAB83916B",
    }
    const arbitrum = {
        rpc: "https://goerli-rollup.arbitrum.io/rpc",
        taskRunnerAddress: "0xdDe55Bbf8bB6b13C11De0AfDb8214f245dB48d4a",
    }
    const goerli = {
        rpc: "https://goerli.infura.io/v3/55c5715ea59149e799b91e8c06463e1c",
        taskRunnerAddress: "0x315e6a2ADF450B50C95F64B5DF0b4A6b7908E7e9",
    }
    // const disable_cors = "https://cors-anywhere.herokuapp.com/"
    // const provider = new ethers.providers.JsonRpcProvider(goerli.rpc);
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // const signer = new ethers.Wallet(privateKey, provider);
    const signer = await provider.getSigner();

    const taskRunnerABIResponse = await fetch("./data/TaskRunnerABI.json");
    const taskRunnerABI = await taskRunnerABIResponse.json()

    const taskRunner = new ethers.Contract(
        goerli.taskRunnerAddress, taskRunnerABI, signer
    );
    // // sleep 2 seconds
    // await new Promise(resolve => setTimeout(resolve, 2000));
    return listener(taskRunner)
}

test()
