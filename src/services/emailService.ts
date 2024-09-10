import { Resend } from 'resend';

const resend = new Resend('your_resend_api_key');

export const sendOrderNotification = async (orderId: number, recipientEmail: string) => {
	const { data, error } = await resend.emails.send({
		to: recipientEmail,
		from: 'hello@example.com',
		subject: `Order Confirmation - Order #${orderId}`,
		html: `<p>Your order with ID ${orderId} has been successfully placed.</p>`,
	});

	return Response.json({ data, error });
};
