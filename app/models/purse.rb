class Purse < ActiveRecord::Base
	belongs_to :user
	validates_numericality_of :balance, :greater_than_or_equal_to => 0

	after_create :log_user_balance_action

	def receive value
		self.balance += value
		transaction do
			save
			UserBalanceAction.in(user, value)
		end
	end

	def pay value
		if value <= balance
			self.balance -= value
		else
			raise "Not enough money"
		end
		transaction do
			save
			UserBalanceAction.out(user, value)
		end
	end

	def has? value
		value <= balance
	end

	private

	def log_user_balance_action
		UserBalanceAction.in(user, balance) if 0 < balance && user
	end
end
