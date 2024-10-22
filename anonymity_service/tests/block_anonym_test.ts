import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Initialize constants for testing
const CONTRACT_NAME = "anonymity-service";
const ERR_OWNER_ONLY = 100;
const ERR_ALREADY_INITIALIZED = 101;
const ERR_NOT_INITIALIZED = 102;
const ERR_INVALID_MESSAGE_LENGTH = 103;
const ERR_MESSAGE_NOT_FOUND = 104;
const ERR_INVALID_MESSAGE_COUNT = 105;
const ERR_MESSAGE_LIMIT_EXCEEDED = 106;

Clarinet.test({
    name: "Ensure that contract initialization works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;
        const user1 = accounts.get("wallet_1")!;

        // Test initialization by non-owner (should fail)
        let block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "initialize",
                [],
                user1.address
            )
        ]);
        assertEquals(block.receipts[0].result, `(err u${ERR_OWNER_ONLY})`);

        // Test initialization by owner (should succeed)
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "initialize",
                [],
                deployer.address
            )
        ]);
        assertEquals(block.receipts[0].result, "(ok true)");

        // Test double initialization (should fail)
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "initialize",
                [],
                deployer.address
            )
        ]);
        assertEquals(block.receipts[0].result, `(err u${ERR_ALREADY_INITIALIZED})`);
    },
});

Clarinet.test({
    name: "Ensure that anonymous message sending works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;
        const user1 = accounts.get("wallet_1")!;

        // Initialize contract
        let block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "initialize",
                [],
                deployer.address
            )
        ]);

        // Test sending valid message
        const validMessage = "This is a valid test message with sufficient length";
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "send-anonymous-message",
                [types.utf8(validMessage)],
                user1.address
            )
        ]);
        assertEquals(block.receipts[0].result, "(ok u0)");

        // Verify message content
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "get-message",
                [types.uint(0)],
                user1.address
            )
        ]);
        assertEquals(
            block.receipts[0].result,
            `(some {content: "${validMessage}", sender: none})`
        );
    },
});


Clarinet.test({
    name: "Ensure that bulk message sending works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;
        const user1 = accounts.get("wallet_1")!;

        // Initialize contract
        let block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "initialize",
                [],
                deployer.address
            )
        ]);

        // Test sending bulk messages
        const message1 = "This is the first test message with sufficient length";
        const message2 = "This is the second test message with sufficient length";
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "send-bulk-messages",
                [
                    types.utf8(message1),
                    types.utf8(message2)
                ],
                user1.address
            )
        ]);
        assertEquals(block.receipts[0].result, "(ok {first-id: u0, second-id: u1})");
    },
});

Clarinet.test({
    name: "Ensure that service pause and resume functions work correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;
        const user1 = accounts.get("wallet_1")!;

        // Initialize contract
        let block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "initialize",
                [],
                deployer.address
            )
        ]);

        // Test pausing service
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "pause-service",
                [],
                deployer.address
            )
        ]);
        assertEquals(block.receipts[0].result, "(ok true)");

        // Test sending message while paused (should fail)
        const message = "This message should not be accepted";
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "send-anonymous-message",
                [types.utf8(message)],
                user1.address
            )
        ]);
        assertEquals(block.receipts[0].result, `(err u${ERR_NOT_INITIALIZED})`);

        // Test resuming service
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "resume-service",
                [],
                deployer.address
            )
        ]);
        assertEquals(block.receipts[0].result, "(ok true)");
    },
});

Clarinet.test({
    name: "Ensure that message retrieval functions work correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;
        const user1 = accounts.get("wallet_1")!;

        // Initialize contract
        let block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "initialize",
                [],
                deployer.address
            )
        ]);

        // Send test messages
        const message = "Test message with sufficient length for testing";
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "send-anonymous-message",
                [types.utf8(message)],
                user1.address
            )
        ]);

        // Test message count
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "get-message-count",
                [],
                user1.address
            )
        ]);
        assertEquals(block.receipts[0].result, "u1");

        // Test message existence
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "does-message-exist",
                [types.uint(0)],
                user1.address
            )
        ]);
        assertEquals(block.receipts[0].result, "true");

        // Test get last message ID
        block = chain.mineBlock([
            Tx.contractCall(
                CONTRACT_NAME,
                "get-last-message-id",
                [],
                user1.address
            )
        ]);
        assertEquals(block.receipts[0].result, "(ok u0)");
    },
});