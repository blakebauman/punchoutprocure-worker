import { describe, it, expect } from 'vitest';
import { handlePunchOutSetupRequest, createPunchOutSetupResponse, handlePunchOutOrderMessage } from '../punchoutService';

// Example XML strings for testing
const examplePunchOutSetupRequest = `
  <PunchOutSetupRequest>
    <Header>
      <From>
        <Credential>buyer-credential</Credential>
      </From>
      <To>
        <Credential>supplier-credential</Credential>
      </To>
      <Sender>
        <Credential>sender-credential</Credential>
        <UserAgent>some-agent</UserAgent>
      </Sender>
    </Header>
    <BuyerCookie>cookie123</BuyerCookie>
    <BrowserFormPost>some-url</BrowserFormPost>
  </PunchOutSetupRequest>
`;

describe('PunchOutService', () => {
	it('should handle PunchOutSetupRequest and return session info', async () => {
		const response = await handlePunchOutSetupRequest(examplePunchOutSetupRequest);
		expect(response.success).toBe(true);
		expect(response.buyerCookie).toBe('cookie123');
	});

	it('should create a valid PunchOutSetupResponse', async () => {
		const response = await createPunchOutSetupResponse('cookie123', 'https://supplier.com/catalog');
		expect(response).toContain('<URL>https://supplier.com/catalog</URL>');
	});

	it('should handle PunchOutOrderMessage and return order details', async () => {
		const exampleOrderMessage = `
      <OrderMessage>
        <ItemIn>
          <ItemID>item123</ItemID>
          <Quantity>2</Quantity>
          <UnitPrice>
            <Money>100.00</Money>
          </UnitPrice>
        </ItemIn>
      </OrderMessage>
    `;
		const response = await handlePunchOutOrderMessage(exampleOrderMessage);
		expect(response.success).toBe(true);
		expect(response.orderDetails[0].itemId).toBe('item123');
		expect(response.orderDetails[0].quantity).toBe(2);
		expect(response.orderDetails[0].unitPrice).toBe('100.00');
	});
});
