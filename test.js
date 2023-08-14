const ethers = require("ethers")
const fs = require("fs");


function listener(taskRunner) {
    const intervalId = setInterval(async () => {
        let numResults = await taskRunner.getAvailableTaskResultsCount(1);
        console.log("[test.js] numResults", numResults)
        if (numResults >= 2) {
            clearInterval(intervalId)
            return numResults
        }
    }, 1000);
}

async function test() {
    const lazy_private_key = fs.readFileSync("../freewillai/.env");
    const private_key = String(lazy_private_key)
        .replace('PRIVATE_KEY=', '')
        .trim();

    const anvil_rpc = "http://127.0.0.1:8545";
    const provider = new ethers.JsonRpcProvider(anvil_rpc);
    const signer = new ethers.Wallet(private_key, provider);

    const taskRunnerAddress = "0xDAE95F004b4B308921c8fdead101555eAB83916B";
    const taskRunnerABIResponse = fs.readFileSync("./data/TaskRunnerABI.json");
    const taskRunnerABI = await JSON.parse(taskRunnerABIResponse)

    const taskRunner = new ethers.Contract(
        taskRunnerAddress, taskRunnerABI, signer
    );
    // // sleep 2 seconds
    // await new Promise(resolve => setTimeout(resolve, 2000));
    return listener(taskRunner)
}

test()
