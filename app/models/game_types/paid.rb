class GameTypes::Paid < GameTypes::Base
	validates_presence_of :start_payment
	validates_numericality_of :start_payment, :greater_than_or_equal_to => 0

	def payment_value
		start_payment * Conf[:drop]
	end

	protected

	def purse user
		user.money_purse
	end
end
