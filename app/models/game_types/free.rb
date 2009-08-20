class GameTypes::Free < GameTypes::Base
	before_save :set_start_payment

	def payment_value
		start_payment
	end
	
	protected

	def purse user
		user.chips_purse
	end

	def set_start_payment
		self.start_payment = start_stack
	end
end
