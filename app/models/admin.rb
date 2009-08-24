class Admin < User
	def admin?
		true
	end
	def can_refill_chips?
		true
	end
end
