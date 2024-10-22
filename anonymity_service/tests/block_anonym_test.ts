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