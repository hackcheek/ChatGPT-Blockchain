const TypeEffect = {
    props: {
        text: String,
        interval: {
            type: Number,
            default: 0.05  // in seconds
        },
        stopDuration: {
            type: Number,
            default: 0.2  // max stop duration in seconds
        },
        pauseChance: {
            type: Number,
            default: 0.05  // chance of a pause
        }
    },
    data() {
        return {
            displayedText: '',
            shouldPause: false
        };
    },
    methods: {
        initiatePause() {
            setTimeout(() => {
                if (Math.random() < this.pauseChance) {
                    this.shouldPause = true;
                    let randomPauseDuration = Math.random() * this.stopDuration * 1000;
                    setTimeout(() => {
                        this.shouldPause = false;
                        this.typeText();
                    }, randomPauseDuration);
                }
                this.initiatePause();
            }, 100);
        },
        typeText() {
            if (!this.shouldPause && this.displayedText.length < this.text.length) {
                this.displayedText += this.text[this.displayedText.length];
                let rand = Math.random()
                let randomDelay = this.interval * 1000 * rand * rand * rand;
                setTimeout(this.typeText, randomDelay);
            }
        }
    },
    mounted() {
        this.initiatePause();
        this.typeText();
    },
    template: `
        <div>{{ displayedText }}</div>
    `
}


function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

const app = Vue.createApp({
    data() {
        return {
            gptUrl: 'https://ipfs.io/ipfs/QmVvj4LzCwR8NZuDbUf1qxpnA6QcGr2FJVJnGiZ9ExWoBT',
            alpacaBaseUrl: 'https://ipfs.io/ipfs/QmQMJpMh6p5tAunMdh3jHHBhHbwLLgbPfdVi2cDBk6NQpQ',
            alpacaLargeUrl: 'https://ipfs.io/ipfs/QmWSHzSH18as5tPyXou9gKZ7X2FCNDaQyGfS87rT1gqz5D',
            modelUrl: 'https://ipfs.io/ipfs/QmaCB8TzHQLHFg8UGques8bdQ7tX9ZmvfpJWSnYriyGPfS',
            walletAddress: null,
            walletAccounts: [],
            walletDropdown: false,
            networkDropdown: false,
            newMessage: "",
            messages: [],
            ipfsNode: null,
            tokenABI: null, 
            taskRunnerABI: null, 
            tokenAddress: null,
            taskRunnerAddress: null,
            token: null,
            taskRunner: null,
            network: 'devnet/anvil',
            networks: null,
            whitelistedNetworks: ["devnet/anvil", "testnet/gnosis", "testnet/polygon/zkevm", "testnet/neon", "testnet/mantle", "testnet/linea"],
            waitingForResponse: false,
        }
    },
    computed: {
        whitelistedNetworks() {
          return Object.keys(this.networks).filter(network => this.whitelistedNetworks.includes(network));
        }
    },
    async created(){
        const tokenABIResponse = await fetch("data/FreeWillAITokenABI.json")
        this.tokenABI = await tokenABIResponse.json()

        const taskRunnerABIResponse = await fetch("data/TaskRunnerABI.json")
        this.taskRunnerABI = await taskRunnerABIResponse.json()

        const networksResponse = await fetch("data/networks.json")
        this.networks = await networksResponse.json()

        await this.selectNetwork(this.network)
    },
    methods: {
        abbreviateAddress(address, charsToKeep) {
            if(address){
                const prefix = address.slice(0, charsToKeep + 2) // Include '0x' in counting
                const suffix = address.slice(-charsToKeep)
                return `${prefix}...${suffix}`
            }
            return null;
        },
        abbreviateIPFSURL(url, charsToKeep) {
            if(url){
                const urlParts = url.split('/')
                const hash = urlParts.pop()
                const prefix = hash.slice(0, charsToKeep)
                const suffix = hash.slice(-charsToKeep)
                urlParts.push(`${prefix}...${suffix}`)
                return urlParts.join('/')
            }else{
                return null;
            }
        },
        explorerUrl(tx_hash) {
            return this.networks[this.network].explorer + "/" + tx_hash
        },
        nextResponse(message){
            // returns the next message if it is a bot response
            let index = this.messages.indexOf(message)
            if(index < this.messages.length - 1){
                let nextMessage = this.messages[index + 1]
                if(nextMessage.role == 'bot'){
                    return nextMessage
                }
            }
            return null
        },
        toggleMessageInfo(message){
            message.open = !message.open
        },
        async generateIPFSHash(text) {
            const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
            let hash = 0;
            text.split('').forEach(c => hash = (hash * 31 + c.charCodeAt(0)) % 1000000000000000000)
            let base58Number = ''
            while (hash > 0) {
                base58Number = base58Chars[hash % 58] + base58Number
                hash = Math.floor(hash / 58)
            }
            let pseudoHash = base58Number
            return `Qm${pseudoHash}`
        },
        async generateIPFSURL(text){
            let hash = await this.generateIPFSHash(text)
            return `https://ipfs.io/ipfs/${hash}`
        },
        async sendMessage() {
            for(let message of this.messages){
                message.open = false
            }
            
            this.waitingForResponse = true
            console.log(this.newMessage)
            let message = {role: 'user', text: this.newMessage, error: false, open: false}

            this.messages.push(message)
            this.newMessage = ''

            this.scrollToLastMessage()
            setTimeout(()=>{
                message.open = true
                this.messages = [...this.messages];
            }, 400)

            prompt = "prompt:" + message.text
            let prompt_url = await this.uploadToIPFS(prompt)
            message.url = prompt_url
            let { transaction, taskIndex, error } = await this.runTask(
                this.modelUrl, prompt_url
            )
            message.tx = transaction?.transactionHash
            message.taskIndex = taskIndex
            message.error = error
            if(error){
                this.waitingForResponse = false
                this.focusInput()
                this.scrollToLastMessage()
                this.messages = [...this.messages];
            }
        },
        scrollToLastMessage() {
            const messagesDiv = document.querySelector('.messages');
            const allMessages = messagesDiv.querySelectorAll('.message');
            const lastMessage = allMessages[allMessages.length - 1];
            if (lastMessage) {
                lastMessage.scrollIntoView({ behavior: 'smooth' });
            }
        },
        focusInput() {
            const inputElement = document.querySelector('.send-message');
            if (inputElement) {
                inputElement.focus();
            }
        },
        async sendResponse(responseUrl, transaction) {
            let responseText = await this.downloadFromIPFS(responseUrl)
            this.messages.push({role: 'bot', text: responseText, url: responseUrl, tx: transaction.transactionHash})
            this.waitingForResponse = false
            this.focusInput()
            this.scrollToLastMessage()
        },
        async connectWallet() {
            console.log(`[0] ${window.ethereum}`)
            if (typeof window.ethereum !== 'undefined') {
                // Requesting access to the user's wallet
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
                    this.walletAccounts = accounts
                    this.walletAddress = this.walletAccounts[0]
                    console.log('Wallet connected successfully!')
                } catch (error) {
                    console.error('Failed to connect wallet:', error)
                }
            } else {
                console.error('No Ethereum provider found. Please install MetaMask or another Ethereum wallet extension.')
            }
        },      
        handleEnter(event) {
            if (event.shiftKey) {
                // Insert a newline at the cursor position
                let start = event.target.selectionStart;
                let end = event.target.selectionEnd;
                this.newMessage = this.newMessage.substring(0, start) + "\n" + this.newMessage.substring(end);
                // Move the cursor to right after the inserted newline
                event.target.selectionStart = event.target.selectionEnd = start + 1;
            } else {
                if (!this.walletAddress) {
                    // window.alert("Connect wallet")
                    let message = {
                        role: 'user',
                        text: this.newMessage,
                        error: "Wallet is not connected",
                        open: true,
                    }
                    this.messages.push(message)
                    return
                }
                // Call the sendMessage method
                this.sendMessage();
            }
        },
        async dropdownWallet(){
            if(!this.walletAddress){
                await this.connectWallet()
            } else {
                this.walletDropdown = !this.walletDropdown
            }
        },
        async dropdownNetwork(){
            this.networkDropdown = !this.networkDropdown
        },
        selectWallet(account) {
            this.walletAddress = account
            this.walletDropdown = false
        },
        async selectNetwork(network) {
            // TODO: switch network when it's selected
            this.network = network
            this.networkDropdown = false
            this.tokenAddress = this.networks[this.network].token_address
            this.taskRunnerAddress = this.networks[this.network].task_runner_address

            const provider = this.getProvider();
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            console.log("Signer's address:", address);

            // Vue.markRaw dettachs Contract class from Vue Proxy
            this.token = Vue.markRaw(new ethers.Contract(
                this.tokenAddress, this.tokenABI, signer
            ));
            this.taskRunner = Vue.markRaw(new ethers.Contract(
                this.taskRunnerAddress, this.taskRunnerABI, signer
            ));
            console.log("taskRunner", this.taskRunner)
        },
        getProvider(){
            // TODO: switch network when it's selected
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            // const provider = Vue.computed(() => new ethers.providers.Web3Provider(window.ethereum));

            //rpcUrl = this.networks[this.network].rpc_urls[0]
            // const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
            return provider // .value
        },
        async getAccountBalance(address) {
            try {
                const provider = this.getProvider()
                const balance = await provider.getBalance(address);
                return await ethers.utils.formatEther(balance)
            } catch (error) {
                console.log('Error retrieving balance: ' + error)
            }
        },
        async uploadToIPFS(text) {
            const textEncoder = new TextEncoder()
            const textBuffer = textEncoder.encode(text)
            
            if (!this.ipfsClient) {
                this.ipfsClient = IpfsHttpClient.create('http://localhost:5001')
            }
            
            const result = await this.ipfsClient.add(textBuffer)
            await this.ipfsClient.pin.add(result.cid)
            this.url = `https://ipfs.io/ipfs/${result.cid.toString()}`
            console.log(`File uploaded to IPFS. URL: ${this.url}`)

            return this.url
        },
        async downloadFromIPFS(ipfsUrl) {
            let startTime = Date.now()
            console.log(`Downloading file from IPFS. URL: ${ipfsUrl}`)
            if (!this.ipfsClient) {
                this.ipfsClient = IpfsHttpClient.create('http://localhost:5001');
            }

            // Extract the CID from the URL
            const cid = ipfsUrl.split('ipfs/')[1];

            // Fetch the content of the file
            const stream = this.ipfsClient.cat(cid);
            let data = '';

            // Listen for data from the stream
            for await (const chunk of stream) {
                // IPFS returns data as Buffer, convert it to a string
                data += new TextDecoder().decode(chunk)
            }
            deltaTime = Date.now() - startTime
            console.log(`File downloaded in ${deltaTime} ms`);
            // At this point, data should contain the full content of the file.
            console.log('Downloaded data:', data);

            return data;
        },
        async uploadToIPFS2(text) {
            const textEncoder = new TextEncoder()
            const textBuffer = textEncoder.encode(text)
            if (!this.ipfsNode) {
                // version using local javascript node:
                //this.ipfsNode = await Ipfs.create();

                // version using localhost ipfs daemon:
                this.ipfsNode = await Ipfs.create({
                    config: {
                        Addresses: {
                        Swarm: [],
                        API: "/ip4/127.0.0.1/tcp/5001",
                        Gateway: "/ip4/127.0.0.1/tcp/8080"
                        },
                        Bootstrap: []
                    }
                })
            }
            const result = await this.ipfsNode.add(textBuffer)
            await this.ipfsNode.pin.add(result.cid)
            this.url = `https://ipfs.io/ipfs/${result.cid.toString()}`
            console.log(`File uploaded to IPFS. URL: ${this.url}`)

            return this.url
        },
        async runTask(modelUrl, datasetUrl) {
            try{
                console.log("Token contract address:", this.token.address);
                console.log("Task runner contract address:", this.taskRunner.address);

                const amountToApprove = ethers.utils.parseUnits('100.0', 18);  // Allow the spender to transfer 10 tokens
                const tx = await this.token.approve(this.taskRunnerAddress, amountToApprove);
                console.log("Waiting for transaction approve to be mined...", tx);
                await tx.wait();
                console.log("Approved tokens for task runner contract");
                
                
                // Define parameters for addTask function
                let minTime = 0; // seconds
                let maxTime = 200; // seconds
                let minResults = 2;
                let startTime = Math.floor(Date.now() / 1000); // seconds

                // Estimate gas price
                let gasEstimate = await this.taskRunner.estimateGas.addTask(
                    modelUrl, datasetUrl, minTime, maxTime, minResults,
                    { from: this.walletAddress }
                );

                // Call addTask function
                console.log("Calling addTask function...");
                let response = await this.taskRunner.addTask(
                    modelUrl, datasetUrl, minTime, maxTime, minResults,
                    { gasLimit: gasEstimate, from: this.walletAddress }
                );
                console.log("addTask function called");
                console.log("running test")

                // Wait for transaction to be mined
                console.log("Waiting for transaction addTask to be mined...");
                let receipt = await response.wait();
                console.log("Transaction mined!");
                let taskAddedEvent = receipt.events.find(event => event.address.toLowerCase() === this.taskRunnerAddress.toLowerCase());
                let taskIndex = taskAddedEvent.args.taskIndex
                if (taskIndex === undefined) {
                    throw new Error(`Failed to find ${event} event in transaction receipt`);
                }

                let listeningResults = false
                const intervalId = setInterval(()=>{
                    let taskMessage = this.messages.filter(
                        message => message.taskIndex == taskIndex
                    )[0]
                    if(taskMessage){
                        if (!listeningResults) {
                            this.taskRunner.on(
                                "TaskSubmitted",
                                (taskIndex, resultUrl, resultsCount, sender) => {
                                    this.processResultsCount(
                                        taskIndex,
                                        resultsCount,
                                        modelUrl,
                                        datasetUrl,
                                        taskMessage,
                                        intervalId,
                                    )
                                    console.log(`Task Submmited, 
                                        taskIndex=${taskIndex}, \
                                        resultUrl=${resultUrl}, \
                                        resultCounts=${resultsCount}, \
                                        sender=${sender}`
                                    )
                                }
                            );
                            listeningResults = true
                        }
                        if (taskMessage.validated === undefined) {
                            taskMessage.validated = false
                        }
                        taskMessage.minResults = minResults
                        taskMessage.maxTime = maxTime
                        taskMessage.minTime = minTime
                        taskMessage.startTime = startTime
                        taskMessage.time = Math.floor(Date.now() / 1000) - startTime
                        if(taskMessage.time >= maxTime){
                            taskMessage.time = maxTime
                            clearInterval(intervalId)
                        }
                    }
                }, 200)

                // ORIGIN
                // const intervalDelay = 200
                // let intervalId = setInterval(async ()=>{
                //     let resultsCount = await this.getResultsCount(taskIndex);
                //     // filter messages to get the message that has this taskIndex
                //     let taskMessage = this.messages.filter(
                //         message => message.taskIndex == taskIndex
                //     )[0]
                //     if(taskMessage){
                //         taskMessage.resultsCount = resultsCount
                //         taskMessage.minResults = minResults
                //         taskMessage.maxTime = maxTime
                //         taskMessage.minTime = minTime
                //         taskMessage.startTime = startTime
                //         taskMessage.time = Math.floor(Date.now() / 1000) - startTime
                //         if(taskMessage.time >= maxTime){
                //             taskMessage.time = maxTime
                //             clearInterval(intervalId)
                //         }
                //     }

                //     // Validate task if ready
                //     let ready = await this.taskRunner.checkIfReadyToValidate(taskIndex);
                //     console.log("Task ready to validate: ", ready, "Task index: ", taskIndex)
                //     if(ready){
                //         console.log("Task ready to validate")
                //         clearInterval(intervalId)
                //         let validateResponse = await this.taskRunner.validateTaskIfReady(taskIndex);
                //         console.log("Waiting for transaction validateTaskIfReady to be mined...");
                //         let validateReceipt = await validateResponse.wait();  // Wait for transaction to be mined
                //         console.log("Transaction mined!");
                //         let responseUrl = await this.taskRunner.getTaskResult(modelUrl, datasetUrl)
                //         console.log("Response URL: " + responseUrl)
                //         await this.sendResponse(responseUrl, validateReceipt)
                //     }
                // }, intervalDelay)
                

                if (receipt.status) {
                    console.log("Transaction successful");
                } else {
                    console.log("Transaction failed");
                }
                return { transaction: receipt, taskIndex: taskIndex, error: false };
            } catch (error) {
                console.log(error)
                return { transaction: null, taskIndex: null, error: error };
            }
        },
        async processResultsCount(
            taskIndex,
            resultsCount,
            modelUrl,
            datasetUrl,
            taskMessage,
            intervalId
        ){
            taskMessage.resultsCount = resultsCount
            // Validate task if ready
            let ready = await this.taskRunner.checkIfReadyToValidate(taskIndex);
            console.log("Task ready to validate: ", ready, "Task index: ", taskIndex)
            if(ready && !taskMessage.validated){
                clearInterval(intervalId)
                taskMessage.validated = true
                console.log("Task ready to validate")
                let validateResponse = await this.taskRunner.validateTaskIfReady(taskIndex);
                console.log("Waiting for transaction validateTaskIfReady to be mined...");
                let validateReceipt = await validateResponse.wait();  // Wait for transaction to be mined
                console.log("Transaction mined!");
                let responseUrl = await this.taskRunner.getTaskResult(modelUrl, datasetUrl)
                console.log("Response URL: " + responseUrl)
                await this.sendResponse(responseUrl, validateReceipt)
            }
        },
        async getResultsCount(taskIndex) {
            let numResults = await this.taskRunner.getAvailableTaskResultsCount(taskIndex);
            console.log("Number of results for task " + taskIndex + ": " + numResults.toString());
            return numResults;
        },
    }
});

app.component('type-effect', TypeEffect)
app.mount('#app');
