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

	named_scope :active, :conditions => ['last_request_at > ?', 10.minutes.ago]
  
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

	def can_refill_chips?
		!has_too_many_chips? and next_refill_in <= 0
	end

	def has_too_many_chips?
		chips_purse.has?(Conf[:refill_chips_max_value])
	end

	def next_refill_in
		(Conf[:refill_chips_time] - (Time.now - refill_chips_at)).round
	end

	def refill_chips!
		chips_purse.receive Conf[:refill_chips_value]
		update_attribute :refill_chips_at, Time.now
	end

	def refill_chips_at
		self[:refill_chips_at] ||= 1.year.ago
	end
end
