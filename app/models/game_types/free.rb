class GameTypes::Free < GameTypes::Base
	def get_payment user
    user.chips_purse.pay(payment_value)
  end

	def return_payment user
		user.chips_purse.receive(payment_value)
	end

	def payment_value
		start_payment
	end
	
	def may_be_created_by? user
		user.chips_purse.has?(payment_value) and verify_user_level(user.level)
	end
end
