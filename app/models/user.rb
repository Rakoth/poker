require 'digest/sha1'

class User < ActiveRecord::Base
	acts_as_authentic
 
  has_one :info, :dependent => :destroy, :class_name => "UserInfo", :foreign_key => "user_id"
  has_many :players
  has_many :user_balance_logs
  has_many :games, :through => :players
  has_many :notes

  def authorize? password
    password.crypt(salt) == self.crypted_password
  end

  def have_money? type
    cash >= type.pay_for_play
  end
  
  def can_join? game
    game.waited? and can_create?(game.type) and not game.users.include?(self)
  end

  def can_create? type
    have_money?(type) and type.verify_user_level(level)
  end

	def join! game
		players.create(:game => game, :sit => game.first_free_sit, :stack => game.type.start_stack) if can_join? game
	end

	def current_player game_or_game_id
		game_id = game_or_game_id.is_a?(Game) ? game_or_game_id.id : game_or_game_id
		players.find_by_game_id game_id
	end
end
