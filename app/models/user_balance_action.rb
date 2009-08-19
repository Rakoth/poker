class UserBalanceAction < ActiveRecord::Base
  belongs_to :user

  def self.in(user, value)
    self.create(
      :user => user,
      :value => value
    )
  end

  def self.out(user, value)
    self.create(
      :user => user,
      :value => -value
    )
  end
end
