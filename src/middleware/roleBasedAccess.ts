export const roleBasedAccess = (requiredRole: string) => {
	return async (req: Request, tenantUser: any) => {
		const userRole = tenantUser.role;

		const rolesHierarchy: { [key: string]: number } = {
			'read-only': 1,
			editor: 2,
			admin: 3,
		};

		// Check if the user's role meets the required role
		if (rolesHierarchy[userRole] < rolesHierarchy[requiredRole]) {
			return new Response(JSON.stringify({ error: 'Access Denied' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
		}

		return null; // Role is valid
	};
};
