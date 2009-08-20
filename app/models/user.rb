class User < ActiveRecord::Base
	acts_as_authentic
	apply_simple_captcha :message => I18n.t('activerecord.errors.messages.wrong_captcha')

  has_one :info, :dependent => :destroy, :class_name => "UserInfo", :foreign_key => "user_id"
  has_many :players
  has_many :user_balance_logs
  has_many :games, :through => :players
  has_many :notes
	has_one :money_purse, :class_name => 'UserPurses::Money'
	has_one :chips_purse, :class_name => 'UserPurses::Chips'
  
  def can_join? game
    game.waited? and game.type.may_be_created_by?(self) and not game.users.include?(self)
  end

	def join! game
		players.create(:game => game, :sit => game.first_free_sit, :stack => game.type.start_stack)
	end

	def current_player game_or_game_id
		game_id = game_or_game_id.is_a?(Game) ? game_or_game_id.id : game_or_game_id
		players.find_by_game_id game_id
	end

	def admin?
		false
	end
end
