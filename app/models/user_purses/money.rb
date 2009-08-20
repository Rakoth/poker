class UserPurses::Money < UserPurses::Base
	after_update :log_user_balance_action

	attr_accessible # все атрибуты закрыты

	def after_initialize
		@old_balance = balance
	end

	private

	def log_user_balance_action
		value = balance - @old_balance
		unless 0 == value
			UserBalanceAction.create(:user => user, :value => value)
			@old_balance = balance
		end
	end
end