import { describe, it, expect } from 'vitest';
import { handlePunchOutOrderMessage } from '../punchoutOrderService';

const examplePunchOutOrderMessage = `
  <PunchOutOrderMessage>
    <BuyerCookie>cookie123</BuyerCookie>
    <PunchOutOrderMessageHeader>
      <Total>
        <Money currency="USD">500.00</Money>
      </Total>
    </PunchOutOrderMessageHeader>
    <ItemIn>
      <ItemID>item123</ItemID>
      <Quantity>2</Quantity>
      <UnitPrice>
        <Money currency="USD">100.00</Money>
      </UnitPrice>
    </ItemIn>
    <ItemIn>
      <ItemID>item456</ItemID>
      <Quantity>1</Quantity>
      <UnitPrice>
        <Money currency="USD">300.00</Money>
      </UnitPrice>
    </ItemIn>
  </PunchOutOrderMessage>
`;

describe('PunchOutOrderService', () => {
	it('should process PunchOutOrderMessage and return order details', async () => {
		const response = await handlePunchOutOrderMessage(examplePunchOutOrderMessage);
		expect(response.success).toBe(true);
		expect(response.orderId).toBeDefined();
	});
});
